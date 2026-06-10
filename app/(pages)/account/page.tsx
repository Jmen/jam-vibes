"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profileForm";
import { apiClient, ApiError } from "@/lib/api";
import { Profile } from "@/app/api/my/profile/schema";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    apiClient.my.profile
      .get()
      .then(setProfile)
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.push("/auth");
        }
      });
  }, [router]);

  if (!profile) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} onUpdated={setProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
