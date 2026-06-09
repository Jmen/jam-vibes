-- Audio: an uploaded file, optionally scoped to a jam
CREATE TABLE "public"."audio" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" uuid NOT NULL,
    "jam_id" uuid,
    "file_path" text NOT NULL,
    "file_name" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "deleted" boolean NOT NULL DEFAULT false,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("owner_id") REFERENCES auth.users(id) ON DELETE RESTRICT,
    FOREIGN KEY ("jam_id") REFERENCES public.jams(id) ON DELETE SET NULL
);

CREATE INDEX "audio_owner_id_idx" ON "public"."audio" ("owner_id");
CREATE INDEX "audio_jam_id_idx" ON "public"."audio" ("jam_id");

-- Loops: a committed stack of audio tracks within a jam, with optional lineage
CREATE TABLE "public"."loops" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "jam_id" uuid NOT NULL,
    "parent_id" uuid,
    "owner_id" uuid NOT NULL,
    "name" text NOT NULL DEFAULT '',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "deleted" boolean NOT NULL DEFAULT false,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("jam_id") REFERENCES public.jams(id) ON DELETE RESTRICT,
    FOREIGN KEY ("parent_id") REFERENCES public.loops(id) ON DELETE SET NULL,
    FOREIGN KEY ("owner_id") REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX "loops_jam_id_idx" ON "public"."loops" ("jam_id");
CREATE INDEX "loops_created_at_idx" ON "public"."loops" ("created_at");

-- Loop audio: which audio is in a loop, at what position and mix volume
CREATE TABLE "public"."loop_audio" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "loop_id" uuid NOT NULL,
    "audio_id" uuid NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    "volume" real NOT NULL DEFAULT 1,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "deleted" boolean NOT NULL DEFAULT false,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("loop_id") REFERENCES public.loops(id) ON DELETE RESTRICT,
    FOREIGN KEY ("audio_id") REFERENCES public.audio(id) ON DELETE RESTRICT,
    CONSTRAINT "loop_audio_volume_check" CHECK (volume >= 0 AND volume <= 1)
);

CREATE INDEX "loop_audio_loop_id_idx" ON "public"."loop_audio" ("loop_id");

-- Resolve a loop to its jam without re-triggering RLS in policies
CREATE FUNCTION "public"."loop_jam_id"(_loop_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT jam_id FROM public.loops WHERE id = _loop_id;
$$;

ALTER TABLE "public"."audio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."loops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."loop_audio" ENABLE ROW LEVEL SECURITY;

-- Audio: owners see their own; anyone who can access the jam can see jam audio
CREATE POLICY "Audio viewable by owner or jam audience"
ON "public"."audio"
FOR SELECT
TO authenticated, anon
USING (
    deleted = false
    AND (owner_id = auth.uid() OR public.can_access_jam(jam_id, auth.uid()))
);

CREATE POLICY "Members can upload audio to their jams"
ON "public"."audio"
FOR INSERT
TO authenticated
WITH CHECK (
    owner_id = auth.uid()
    AND (jam_id IS NULL OR public.is_jam_member(jam_id, auth.uid()))
);

CREATE POLICY "Owners can update their audio"
ON "public"."audio"
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- Loops: anyone who can access the jam can see its loops (incl. anon for public jams)
CREATE POLICY "Loops viewable by jam audience"
ON "public"."loops"
FOR SELECT
TO authenticated, anon
USING (deleted = false AND public.can_access_jam(jam_id, auth.uid()));

CREATE POLICY "Members can add loops to their jams"
ON "public"."loops"
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid() AND public.is_jam_member(jam_id, auth.uid()));

CREATE POLICY "Loop owners and jam owners can update loops"
ON "public"."loops"
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.is_jam_owner(jam_id, auth.uid()));

-- Loop audio: follows the loop's jam access
CREATE POLICY "Loop audio viewable by jam audience"
ON "public"."loop_audio"
FOR SELECT
TO authenticated, anon
USING (deleted = false AND public.can_access_jam(public.loop_jam_id(loop_id), auth.uid()));

CREATE POLICY "Members can add loop audio in their jams"
ON "public"."loop_audio"
FOR INSERT
TO authenticated
WITH CHECK (public.is_jam_member(public.loop_jam_id(loop_id), auth.uid()));

CREATE POLICY "Members can update loop audio in their jams"
ON "public"."loop_audio"
FOR UPDATE
TO authenticated
USING (public.is_jam_member(public.loop_jam_id(loop_id), auth.uid()));
