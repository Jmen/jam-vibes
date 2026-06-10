"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check } from "lucide-react";
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
  createInviteSchema,
  CreateInvite,
  InviteView,
} from "@/app/api/jams/[id]/invites/schema";

interface InviteFormProps {
  jamId: string;
}

export function inviteLink(origin: string, token: string): string {
  return `${origin}/invites/accept?token=${token}`;
}

export function InviteForm({ jamId }: InviteFormProps) {
  const [invite, setInvite] = useState<InviteView | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateInvite>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (input: CreateInvite) => {
    setError(null);
    setCopied(false);

    try {
      setInvite(await apiClient.jams.createInvite(jamId, input));
      form.reset();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not invite",
      );
    }
  };

  const link = invite ? inviteLink(window.location.origin, invite.token) : null;

  return (
    <div className="space-y-3">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-end gap-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Invite by email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Invite
          </Button>
        </form>
      </Form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {link && (
        <div
          className="flex items-center gap-2 rounded-md border bg-secondary/50 p-2"
          data-testid="invite-link"
        >
          <code className="flex-1 truncate text-xs">{link}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
            aria-label="Copy invite link"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}
