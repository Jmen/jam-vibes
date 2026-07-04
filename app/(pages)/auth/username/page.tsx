"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsernameForm } from "@/components/auth/usernameForm";
import { emitAuthChanged } from "@/lib/authEvents";
import { toInAppPath } from "@/lib/inAppPath";

function ChooseUsernameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The callback already sanitizes next, but this page is reachable
  // directly with an arbitrary query string.
  const destination = toInAppPath(searchParams.get("next"));

  return (
    <UsernameForm
      onSuccess={() => {
        emitAuthChanged();
        router.push(destination);
      }}
    />
  );
}

export default function ChooseUsernamePage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Choose your username</CardTitle>
          <CardDescription>
            This is how other musicians will see you on jams and loops.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ChooseUsernameContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
