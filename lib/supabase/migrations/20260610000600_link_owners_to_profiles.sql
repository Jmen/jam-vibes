-- Every auth user has a profile (created by trigger), so owner columns can
-- also reference profiles. This gives PostgREST a path to embed the owner's
-- profile (username, avatar) directly in jam and loop queries.
ALTER TABLE "public"."jams"
    ADD CONSTRAINT "jams_owner_id_profiles_fkey"
    FOREIGN KEY ("owner_id") REFERENCES public.profiles(user_id) ON DELETE RESTRICT;

ALTER TABLE "public"."loops"
    ADD CONSTRAINT "loops_owner_id_profiles_fkey"
    FOREIGN KEY ("owner_id") REFERENCES public.profiles(user_id) ON DELETE RESTRICT;
