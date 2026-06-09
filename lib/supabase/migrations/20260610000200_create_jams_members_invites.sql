-- Jams: a collaborative session owned by a user, private by default
CREATE TABLE "public"."jams" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "human_id" text NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "access" text NOT NULL DEFAULT 'private',
    "owner_id" uuid NOT NULL,
    "photo_path" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "deleted" boolean NOT NULL DEFAULT false,
    PRIMARY KEY ("id"),
    UNIQUE ("human_id"),
    FOREIGN KEY ("owner_id") REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT "jams_access_check" CHECK (access IN ('private', 'public'))
);

CREATE INDEX "jams_access_idx" ON "public"."jams" ("access");
CREATE INDEX "jams_owner_id_idx" ON "public"."jams" ("owner_id");
CREATE INDEX "jams_created_at_idx" ON "public"."jams" ("created_at");

-- Membership: owners are members too (added by trigger), invitees join via invites
CREATE TABLE "public"."jam_members" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "jam_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "role" text NOT NULL DEFAULT 'member',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("jam_id", "user_id"),
    FOREIGN KEY ("jam_id") REFERENCES public.jams(id) ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "jam_members_role_check" CHECK (role IN ('owner', 'member'))
);

-- Invites: a token is the capability to join a private jam
CREATE TABLE "public"."invites" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "jam_id" uuid NOT NULL,
    "email" text NOT NULL,
    "token" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_by" uuid NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "accepted_by" uuid,
    "accepted_at" timestamp with time zone,
    PRIMARY KEY ("id"),
    UNIQUE ("token"),
    FOREIGN KEY ("jam_id") REFERENCES public.jams(id) ON DELETE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY ("accepted_by") REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Security definer helpers: used inside RLS policies without re-triggering RLS
CREATE FUNCTION "public"."is_jam_member"(_jam_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.jam_members
        WHERE jam_id = _jam_id AND user_id = _user_id
    );
$$;

CREATE FUNCTION "public"."is_jam_owner"(_jam_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.jams
        WHERE id = _jam_id AND owner_id = _user_id
    );
$$;

CREATE FUNCTION "public"."can_access_jam"(_jam_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.jams
        WHERE id = _jam_id
          AND deleted = false
          AND (access = 'public' OR public.is_jam_member(_jam_id, _user_id))
    );
$$;

-- Owner becomes a member automatically
CREATE FUNCTION "public"."handle_new_jam"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.jam_members (jam_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (jam_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "on_jam_created"
AFTER INSERT ON public.jams
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_jam();

ALTER TABLE "public"."jams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."jam_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

-- Jams: public jams visible to everyone (incl. signed-out), private to members
CREATE POLICY "Public jams or member jams are viewable"
ON "public"."jams"
FOR SELECT
TO authenticated, anon
USING (deleted = false AND (access = 'public' OR public.is_jam_member(id, auth.uid())));

CREATE POLICY "Users can create jams they own"
ON "public"."jams"
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their jams"
ON "public"."jams"
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Jam members: visible to fellow members
CREATE POLICY "Members can view jam membership"
ON "public"."jam_members"
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_jam_member(jam_id, auth.uid()));

CREATE POLICY "Owners can remove members"
ON "public"."jam_members"
FOR DELETE
TO authenticated
USING (public.is_jam_owner(jam_id, auth.uid()) AND role <> 'owner');

-- Invites: only the jam owner manages them; acceptance goes through the API
-- with the service role after validating the token
CREATE POLICY "Owners can view invites"
ON "public"."invites"
FOR SELECT
TO authenticated
USING (public.is_jam_owner(jam_id, auth.uid()));

CREATE POLICY "Owners can create invites"
ON "public"."invites"
FOR INSERT
TO authenticated
WITH CHECK (public.is_jam_owner(jam_id, auth.uid()) AND created_by = auth.uid());
