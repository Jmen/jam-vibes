"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/resetPasswordForm";
import { emitAuthChanged } from "@/lib/authEvents";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");

  if (!tokenHash) {
    return (
      <p className="text-sm text-muted-foreground">
        This reset link is missing its token. Request a new one from the forgot
        password page.
      </p>
    );
  }

  return (
    <ResetPasswordForm
      tokenHash={tokenHash}
      onSuccess={() => {
        emitAuthChanged();
        router.push("/");
      }}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ResetPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
