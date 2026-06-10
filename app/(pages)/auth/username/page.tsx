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

function ChooseUsernameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  // Only ever continue within the app: a bare "/" prefix excludes absolute
  // and protocol-relative ("//host") destinations smuggled into the query.
  const destination =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

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
