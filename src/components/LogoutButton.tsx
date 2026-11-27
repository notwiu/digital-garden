
"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Não foi possível sair.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button className="garden-nav-item" onClick={handleLogout}>
        <LogOut size={17} strokeWidth={1.8} />
        <span>Sair da conta</span>
      </button>
      {error && <small role="alert">{error}</small>}
    </>
  );
}
