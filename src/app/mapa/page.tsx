
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

import StandaloneMap from "@/components/knowledge/StandaloneMap";

export const metadata = {
  title: "Mapa de conhecimento | Digital Garden",
};

async function ProtectedMap() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <StandaloneMap />;
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <main className="garden-loading">
          <div className="garden-loader" />
          <span>Carregando seu mapa...</span>
        </main>
      }
    >
      <ProtectedMap />
    </Suspense>
  );
}
