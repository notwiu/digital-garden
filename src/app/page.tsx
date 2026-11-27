
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Garden from "./Garden";

async function ProtectedGarden() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <Garden />;
}

function LoadingGarden() {
  return (
    <main className="garden-loading">
      <div className="garden-loader" />
      <span>Carregando seu jardim...</span>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingGarden />}>
      <ProtectedGarden />
    </Suspense>
  );
}
