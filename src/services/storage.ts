
import { createClient } from "@/lib/supabase/client";

const BUCKET = "garden-files";
const MAX_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
];

export type UploadedFile = {
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
};

export function validateFile(file: File) {
  if (file.size > MAX_SIZE) {
    throw new Error("O arquivo deve ter até 20 MB.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de arquivo não suportado.");
  }

  if (file.size === 0) {
    throw new Error("O arquivo está vazio.");
  }
}

export async function uploadFile(
  file: File
): Promise<UploadedFile> {
  validateFile(file);

  const supabase = createClient();

  const { data, error: authError } =
    await supabase.auth.getUser();

  if (authError || !data.user) {
    throw new Error("Você precisa estar autenticado.");
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "bin";

  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  };
}

export async function getFileUrl(path: string) {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 300);

  if (error || !data) {
    throw new Error(
      "Não foi possível acessar o arquivo."
    );
  }

  return data.signedUrl;
}

export async function deleteFile(path: string) {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
