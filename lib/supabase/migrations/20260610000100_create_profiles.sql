-- Profiles: one row per auth user, created automatically on signup
CREATE TABLE "public"."profiles" (
    "user_id" uuid NOT NULL,
    "username" text,
    "avatar_path" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id"),
    FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Usernames unique case-insensitively
CREATE UNIQUE INDEX "profiles_username_lower_idx" ON "public"."profiles" (lower(username));

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Profiles are public: usernames and avatars appear on public jams
CREATE POLICY "Profiles are viewable by everyone"
ON "public"."profiles"
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert their own profile"
ON "public"."profiles"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create an empty profile row whenever a user signs up
CREATE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "on_auth_user_created"
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
