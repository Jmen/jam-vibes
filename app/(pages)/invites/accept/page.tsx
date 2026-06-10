"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<string>("Joining the jam…");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) {
      return;
    }
    attempted.current = true;

    apiClient.invites
      .accept({ token })
      .then((result) => {
        router.push(`/jams/${result.humanId}`);
      })
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          setStatus(
            "Sign in (or create an account) first, then open this invite link again.",
          );
        } else {
          setStatus(
            caught instanceof ApiError
              ? caught.message
              : "This invite could not be used.",
          );
        }
      });
  }, [token, router]);

  if (!token) {
    return (
      <p className="text-muted-foreground">This invite link is incomplete.</p>
    );
  }

  return (
    <div className="text-center">
      <p className="text-muted-foreground">{status}</p>
      <Link href="/auth" className="mt-2 inline-block text-sm underline">
        Go to sign in
      </Link>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteContent />
    </Suspense>
  );
}
