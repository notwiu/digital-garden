import { createClient } from "@/lib/supabase/client";

export type Reference = {
  id: string;
  title: string;
  source: string;
  category: string;
  type: "artigo" | "site" | "vídeo" | "arquivo";
  date: string;
  status: "Organizado" | "Pendente";
  favorite: boolean;
  notes: string;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
};

type Fields = Omit<Reference, "id" | "date">;
type Row = Omit<Reference, "date"> & { created_at: string };

function fromRow(row: Row): Reference {
  return {
    ...row, source: row.source ?? "", category: row.category ?? "Sem categoria",
    notes: row.notes ?? "", date: new Date(row.created_at).toLocaleDateString("pt-BR")
  };
}

async function context() {
  const db = createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sessão inválida. Entre novamente.");
  return { db, uid: data.user.id };
}

export async function listReferences() {
  const { db, uid } = await context();
  const { data, error } = await db.from("references").select("*")
    .eq("user_id", uid).order("created_at", { ascending: false }).order("id");
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function saveReference(fields: Fields, id: string | null) {
  const { db, uid } = await context();
  const query = id
    ? db.from("references").update(fields).eq("id", id).eq("user_id", uid)
    : db.from("references").insert({ ...fields, user_id: uid });
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function patchReference(id: string, fields: Partial<Fields>) {
  const { db, uid } = await context();
  const { data, error } = await db.from("references").update(fields)
    .eq("id", id).eq("user_id", uid).select("*").single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function deleteReference(id: string) {
  const { db, uid } = await context();
  const { error } = await db.from("references").delete()
    .eq("id", id).eq("user_id", uid).select("id").single();
  if (error) throw error;
}

export async function importLegacy(raw: string) {
  const { db, uid } = await context();
  const items: unknown = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error("Backup inválido.");
  const rows = items.filter(r => r && Number.isSafeInteger(r.id) && r.id > 4 &&
    typeof r.title === "string" && r.title.trim() &&
    ["artigo", "site", "vídeo", "arquivo"].includes(r.type))
    .map(r => ({
      user_id: uid, legacy_id: String(r.id), title: r.title.trim(),
      source: typeof r.source === "string" ? r.source : "",
      category: typeof r.category === "string" ? r.category : "Sem categoria",
      type: r.type, status: r.status === "Organizado" ? "Organizado" : "Pendente",
      favorite: r.favorite === true, notes: typeof r.notes === "string" ? r.notes : "",
      created_at: new Date(r.id).toISOString()
    }));
  if (rows.length) {
    const { error } = await db.from("references").upsert(rows, {
      onConflict: "user_id,legacy_id", ignoreDuplicates: true
    });
    if (error) throw error;
  }
  return rows.length;
}
