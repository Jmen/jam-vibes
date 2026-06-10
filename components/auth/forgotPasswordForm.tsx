"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiClient, ApiError } from "@/lib/api";
import { forgotPasswordSchema, ForgotPassword } from "@/app/api/auth/schema";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (input: ForgotPassword) => {
    setError(null);

    try {
      await apiClient.auth.forgotPassword(input);
      setSent(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Something went wrong",
      );
    }
  };

  if (sent) {
    return (
      <p className="text-sm" data-testid="reset-email-sent">
        If that address has an account, a reset link is on its way. Check your
        email.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          Send reset link
        </Button>
      </form>
    </Form>
  );
}
