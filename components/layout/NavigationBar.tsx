"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import { onAuthChanged, emitAuthChanged } from "@/lib/authEvents";
import { Profile } from "@/app/api/my/profile/schema";

export function NavigationBar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setProfile(await apiClient.my.profile.get());
    } catch {
      setProfile(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return onAuthChanged(() => void refresh());
  }, [refresh]);

  const signOut = async () => {
    try {
      await apiClient.auth.signOut();
    } finally {
      emitAuthChanged();
      router.push("/");
      router.refresh();
    }
  };

  const displayName = profile?.username ?? profile?.email ?? "";

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold">
            🍇 Jam Vibes
          </Link>
          {profile && (
            <>
              <Link
                href="/jams"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My jams
              </Link>
              <Link
                href="/jams/create"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Create
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!loaded ? null : profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 text-sm"
                data-testid="nav-user-menu"
              >
                <Avatar className="h-7 w-7">
                  {profile.avatarUrl && (
                    <AvatarImage src={profile.avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback>
                    {(displayName[0] ?? "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-32 truncate">{displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => router.push("/auth")}>
              Sign in
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
