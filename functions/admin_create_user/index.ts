// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;            // dostarczane automatycznie
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;      // dostarczane automatycznie
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!; // nasz sekret

    const { org_id, email, full_name, password, role } = await req.json();

    // JWT zalogowanego użytkownika
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401 });

    // klient "caller" = ANON + JWT (egzekwuje RLS i sprawdza rolę admin)
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // klient serwisowy = SERVICE ROLE (do tworzenia konta i zapisu administ.)
    const svc = createClient(url, serviceKey);

    // sprawdź, czy caller jest adminem w tej org
    const { data: mem, error: memErr } = await caller
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .maybeSingle();
    if (memErr) return new Response(memErr.message, { status: 400 });
    if (!mem || mem.role !== "admin") return new Response("Forbidden", { status: 403 });

    // utwórz użytkownika (email + hasło)
    const { data: created, error: cErr } = await svc.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name },
    });
    if (cErr) return new Response(cErr.message, { status: 400 });
    const userId = created.user?.id;
    if (!userId) return new Response("No user id", { status: 400 });

    // profil + członkostwo
    await svc.from("profiles").insert({ user_id: userId, full_name, is_disabled: false });
    await svc.from("org_members").upsert({ org_id, user_id: userId, role: role || "viewer" });

    return new Response(JSON.stringify({ ok: true, user_id: userId }), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "Error", { status: 500 });
  }
});
