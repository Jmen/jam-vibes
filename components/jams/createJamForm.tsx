"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { createJamSchema, CreateJam, JamSummary } from "@/app/api/jams/schema";

// The schema applies defaults, so its input type (fields optional) differs
// from its output type (fields present) — react-hook-form needs both
type CreateJamInput = z.input<typeof createJamSchema>;

interface CreateJamFormProps {
  onCreated: (jam: JamSummary) => void;
}

export function CreateJamForm({ onCreated }: CreateJamFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateJamInput, unknown, CreateJam>({
    resolver: zodResolver(createJamSchema),
    defaultValues: { name: "", description: "", access: "private" },
  });

  const onSubmit = async (input: CreateJam) => {
    setError(null);

    try {
      const jam = await apiClient.jams.create(input);
      onCreated(jam);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not create jam",
      );
    }
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Friday night session" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What's this jam about?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="access"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "private" ? "default" : "outline"}
                    onClick={() => field.onChange("private")}
                  >
                    Private
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "public" ? "default" : "outline"}
                    onClick={() => field.onChange("public")}
                  >
                    Public
                  </Button>
                </div>
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
          Create jam
        </Button>
      </form>
    </Form>
  );
}
