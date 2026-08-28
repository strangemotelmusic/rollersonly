import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

// Supabase's standard storage.upload() has a hard practical limit around
// 6MB regardless of the bucket's file_size_limit setting - anything larger
// (a real magazine PDF, a video) needs the TUS resumable-upload protocol
// instead, which hits a different endpoint (https://<project>.storage.supabase.co)
// and chunks the file. Confirmed via Supabase's own docs after a magazine
// PDF upload kept failing with "The object exceeded the maximum allowed
// size" even after raising the bucket's file_size_limit.
export async function uploadLargeFile(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ error: string } | { ok: true }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "You must be signed in." };

  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;

  return new Promise((resolve) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => resolve({ error: error.message || "Upload failed." }),
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve({ ok: true }),
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    });
  });
}
