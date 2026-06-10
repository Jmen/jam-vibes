"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api";
import { AudioView } from "@/app/api/audio/schema";

interface AudioUploadProps {
  jamId: string;
  onUploaded: (audio: AudioView) => void;
}

export function AudioUpload({ jamId, onUploaded }: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const audio = await apiClient.audio.upload(jamId, file, file.name);
      onUploaded(audio);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Upload failed",
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        data-testid="audio-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        <span className="ml-1">
          {isUploading ? "Uploading…" : "Upload audio"}
        </span>
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
