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
import {
  updateProfileSchema,
  UpdateProfile,
} from "@/app/api/my/profile/schema";

interface UsernameFormProps {
  onSuccess: () => void;
}

// Presented as required — no skip button — but deliberately unenforced:
// abandoning it leaves the generated username standing (docs/adr/0001).
export function UsernameForm({ onSuccess }: UsernameFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { username: "" },
  });

  const onSubmit = async (input: UpdateProfile) => {
    setError(null);

    try {
      await apiClient.my.profile.update(input);
      onSuccess();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not save username",
      );
    }
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="how others see you" {...field} />
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
          Continue
        </Button>
      </form>
    </Form>
  );
}
