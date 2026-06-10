"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const newPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type NewPassword = z.infer<typeof newPasswordSchema>;

interface ResetPasswordFormProps {
  tokenHash: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({
  tokenHash,
  onSuccess,
}: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<NewPassword>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (input: NewPassword) => {
    setError(null);

    try {
      await apiClient.auth.resetPassword({
        tokenHash,
        password: input.password,
      });
      onSuccess();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not reset password",
      );
    }
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
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
          Set new password
        </Button>
      </form>
    </Form>
  );
}
