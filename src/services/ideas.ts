
import { createClient } from "@/lib/supabase/client";
import type { JSONContent } from "@tiptap/core";

export type Maturity =
  | "semente"
  | "em_desenvolvimento"
  | "cultivada"
  | "aplicada";

export const MATURITY = {
  semente: {
    label: "Semente",
    color: "#82966F",
  },
  em_desenvolvimento: {
    label: "Em desenvolvimento",
    color: "#E97836",
  },
  cultivada: {
    label: "Cultivada",
    color: "#7585B2",
  },
  aplicada: {
    label: "Aplicada",
    color: "#477B61",
  },
} as const;

export type Idea = {
  id: string;
  title: string;
  content: JSONContent;
  maturity: Maturity;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

type IdeaFields = Pick<
  Idea,
  "title" | "content" | "maturity" | "favorite"
>;

async function context() {
  const db = createClient();

  const { data, error } = await db.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sessão inválida.");
  }

  return {
    db,
    uid: data.user.id,
  };
}

export async function listIdeas(): Promise<Idea[]> {
  const { db, uid } = await context();

  const { data, error } = await db
    .from("ideas")
    .select("*")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data as Idea[];
}

export async function createIdea(): Promise<Idea> {
  const { db, uid } = await context();

  const { data, error } = await db
    .from("ideas")
    .insert({
      user_id: uid,
      title: "Nova ideia",
      maturity: "semente",
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as Idea;
}

export async function updateIdea(
  id: string,
  fields: Partial<IdeaFields>
): Promise<Idea> {
  const { db, uid } = await context();

  const { data, error } = await db
    .from("ideas")
    .update(fields)
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .single();

  if (error) throw error;

  return data as Idea;
}

export async function deleteIdea(id: string) {
  const { db, uid } = await context();

  const { error } = await db
    .from("ideas")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select("id")
    .single();

  if (error) throw error;
}

export async function listIdeaReferences(
  ideaId: string
): Promise<string[]> {
  const { db } = await context();

  const { data, error } = await db
    .from("idea_references")
    .select("reference_id")
    .eq("idea_id", ideaId);

  if (error) throw error;

  return data.map((item) => item.reference_id);
}

export async function linkReference(
  ideaId: string,
  referenceId: string
) {
  const { db } = await context();

  const { error } = await db
    .from("idea_references")
    .upsert(
      {
        idea_id: ideaId,
        reference_id: referenceId,
      },
      {
        onConflict: "idea_id,reference_id",
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;
}

export async function unlinkReference(
  ideaId: string,
  referenceId: string
) {
  const { db } = await context();

  const { error } = await db
    .from("idea_references")
    .delete()
    .eq("idea_id", ideaId)
    .eq("reference_id", referenceId);

  if (error) throw error;
}


export type IdeaConnection = {
  idea_id: string;
  reference_id: string;
};

export async function listIdeaConnections(): Promise<
  IdeaConnection[]
> {
  const { db } = await context();

  const { data, error } = await db
    .from("idea_references")
    .select("idea_id, reference_id");

  if (error) throw error;

  return data as IdeaConnection[];
}
