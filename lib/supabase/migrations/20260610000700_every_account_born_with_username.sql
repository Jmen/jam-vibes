-- Every account is born with a username: profiles are created with a
-- generated handle instead of NULL, and the column becomes NOT NULL.
-- See docs/adr/0001-auto-generated-usernames-with-cosmetic-choice-prompt.md
--
-- No backfill: there is no deployed data. If this ever runs against a
-- database that does have NULL usernames, SET NOT NULL fails loudly and
-- aborts the migration, which is the safe outcome.

-- Generate a username like "brave-walrus-x4f2": two lowercase words plus a
-- 4-char random suffix, within the username rules (3-30 chars, [a-z0-9_-]).
-- Word lists are sized so the longest combination stays under 30 chars.
CREATE FUNCTION "public"."generate_username"()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    adjectives constant text[] := ARRAY[
        'brave', 'bold', 'bright', 'calm', 'clever', 'cosmic', 'daring',
        'dapper', 'eager', 'fancy', 'fierce', 'fuzzy', 'gentle', 'giddy',
        'golden', 'groovy', 'happy', 'humble', 'jazzy', 'jolly', 'keen',
        'kind', 'lively', 'loud', 'lucky', 'mellow', 'merry', 'mighty',
        'nimble', 'noble', 'peppy', 'perky', 'plucky', 'proud', 'quick',
        'quiet', 'rapid', 'royal', 'shiny', 'silly', 'snazzy', 'spry',
        'sunny', 'swift', 'witty', 'zesty'
    ];
    animals constant text[] := ARRAY[
        'badger', 'bat', 'bear', 'beaver', 'bison', 'camel', 'cobra',
        'condor', 'crane', 'dingo', 'dolphin', 'donkey', 'eagle', 'falcon',
        'ferret', 'finch', 'fox', 'gecko', 'gibbon', 'hare', 'heron',
        'hippo', 'ibis', 'iguana', 'jackal', 'koala', 'lemur', 'lion',
        'llama', 'lynx', 'marmot', 'mole', 'moose', 'narwhal', 'newt',
        'ocelot', 'otter', 'owl', 'panda', 'parrot', 'pelican', 'puffin',
        'quokka', 'rabbit', 'raven', 'seal', 'sloth', 'stoat', 'tapir',
        'tiger', 'toucan', 'turtle', 'viper', 'walrus', 'weasel', 'wombat',
        'yak', 'zebra'
    ];
    suffix_alphabet constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
    suffix text;
    candidate text;
BEGIN
    FOR attempt IN 1..16 LOOP
        suffix := '';
        FOR i IN 1..4 LOOP
            suffix := suffix
                || substr(suffix_alphabet,
                          1 + floor(random() * length(suffix_alphabet))::int,
                          1);
        END LOOP;

        candidate :=
            adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
            || '-'
            || animals[1 + floor(random() * array_length(animals, 1))::int]
            || '-' || suffix;

        IF NOT EXISTS (
            SELECT FROM public.profiles WHERE lower(username) = candidate
        ) THEN
            RETURN candidate;
        END IF;
    END LOOP;

    RAISE EXCEPTION 'generate_username: no free username after 16 attempts';
END;
$$;

-- Only the signup trigger should call this. Functions in the exposed
-- "public" schema are PostgREST RPC endpoints by default; keep this one
-- out of the Data API surface.
REVOKE EXECUTE ON FUNCTION "public"."generate_username"()
    FROM PUBLIC, anon, authenticated;

-- Profiles are now born with a username, in the same transaction as the
-- account. A concurrent signup can race us to the same name between the
-- free-name check and the insert; the unique index on lower(username)
-- catches it and we retry with a fresh name.
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    FOR attempt IN 1..3 LOOP
        BEGIN
            INSERT INTO public.profiles (user_id, username)
            VALUES (NEW.id, public.generate_username())
            ON CONFLICT (user_id) DO NOTHING;
            RETURN NEW;
        EXCEPTION WHEN unique_violation THEN
            -- lost the username race to a concurrent signup; try again
        END;
    END LOOP;

    RAISE EXCEPTION 'handle_new_user: could not assign a username to user %',
        NEW.id;
END;
$$;

ALTER TABLE "public"."profiles" ALTER COLUMN "username" SET NOT NULL;

-- Mirror the API's username rules (app/api/my/profile/schema.ts) at the
-- database boundary: profiles is writable through the Data API under RLS,
-- which would otherwise bypass the zod validation entirely.
ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_username_check"
    CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$');
