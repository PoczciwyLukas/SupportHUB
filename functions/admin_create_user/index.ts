
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey);

    const { org_id, email, full_name, password, role } = await req.json();

    // 1) Caller (JWT)
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401 });
    const caller = createClient(url, serviceKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    // 2) Must be admin in org
    const { data: mem } = await caller.from("org_members").select("role").eq("org_id", org_id).maybeSingle();
    if (!mem || mem.role !== "admin") return new Response("Forbidden", { status: 403 });

    // 3) Create user
    const { data: created, error: cErr } = await client.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name }
    });
    if (cErr) return new Response(cErr.message, { status: 400 });
    const userId = created.user?.id;
    if (!userId) return new Response("No user id", { status: 400 });

    // 4) Profile + member
    await client.from("profiles").insert({ user_id: userId, full_name, is_disabled: false });
    await client.from("org_members").upsert({ org_id, user_id: userId, role: role || "viewer" });

    return new Response(JSON.stringify({ ok: true, user_id: userId }), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "Error", { status: 500 });
  }
});
