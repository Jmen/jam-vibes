"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Profile,
} from "@/app/api/my/profile/schema";
import { emitAuthChanged } from "@/lib/authEvents";

interface ProfileFormProps {
  profile: Profile;
  onUpdated: (profile: Profile) => void;
}

export function ProfileForm({ profile, onUpdated }: ProfileFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { username: profile.username ?? "" },
  });

  const onSubmit = async (input: UpdateProfile) => {
    setError(null);
    setSaved(false);

    try {
      const updated = await apiClient.my.profile.update(input);
      onUpdated(updated);
      setSaved(true);
      emitAuthChanged();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save");
    }
  };

  const uploadAvatar = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const updated = await apiClient.my.profile.uploadAvatar(file, file.name);
      onUpdated(updated);
      emitAuthChanged();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = profile.username ?? profile.email;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={displayName} />
          )}
          <AvatarFallback className="text-xl">
            {(displayName[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            data-testid="avatar-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            <span className="ml-1">
              {profile.avatarUrl ? "Change photo" : "Add photo"}
            </span>
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>

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
          {saved && <p className="text-sm text-green-600">Saved</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </Form>
    </div>
  );
}
