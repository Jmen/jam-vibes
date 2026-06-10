"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateJamForm } from "@/components/jams/createJamForm";

export default function CreateJamPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create a jam</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateJamForm
            onCreated={(jam) => router.push(`/jams/${jam.humanId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
