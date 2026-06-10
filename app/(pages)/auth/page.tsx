"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/signInForm";
import { RegisterForm } from "@/components/auth/registerForm";
import { GoogleSignIn } from "@/components/auth/googleSignIn";
import { emitAuthChanged } from "@/lib/authEvents";

export default function AuthPage() {
  const router = useRouter();

  const onSuccess = () => {
    emitAuthChanged();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Jam Vibes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sign-in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in" className="space-y-4 pt-4">
              <SignInForm onSuccess={onSuccess} />
              <GoogleSignIn />
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/forgot-password" className="underline">
                  Forgot your password?
                </Link>
              </p>
            </TabsContent>
            <TabsContent value="register" className="space-y-4 pt-4">
              <RegisterForm onSuccess={onSuccess} />
              <GoogleSignIn />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
