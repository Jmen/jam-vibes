-- Buckets: audio and jam photos are private (served via signed URLs),
-- avatars are public (referenced directly in <img> tags)
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('audio', 'audio', false),
    ('avatars', 'avatars', true),
    ('jam-photos', 'jam-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Audio objects live under <user_id>/<file>; owners manage their own files.
-- Playback for jam audiences uses signed URLs generated server-side.
CREATE POLICY "Users can upload their own audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatar objects live under <user_id>/<file>; bucket is public for reads
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');

-- Jam photo objects live under <jam_id>/<file>; only the jam owner writes.
-- Reads for jam audiences use signed URLs generated server-side.
-- The owner SELECT policy is required for uploads too: the storage service
-- inserts with RETURNING *, which checks SELECT visibility of the new row.
CREATE POLICY "Jam owners can read jam photo objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'jam-photos'
    AND public.is_jam_owner(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Jam owners can upload jam photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'jam-photos'
    AND public.is_jam_owner(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Jam owners can update jam photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'jam-photos'
    AND public.is_jam_owner(((storage.foldername(name))[1])::uuid, auth.uid())
);
