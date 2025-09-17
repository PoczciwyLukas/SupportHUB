
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey);

    const { org_id, email, role } = await req.json();

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401 });
    const caller = createClient(url, serviceKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    const { data: mem } = await caller.from("org_members").select("role").eq("org_id", org_id).maybeSingle();
    if (!mem || mem.role !== "admin") return new Response("Forbidden", { status: 403 });

    const { data: list, error: lErr } = await client.auth.admin.listUsers();
    if (lErr) return new Response(lErr.message, { status: 400 });
    const user = list.users.find((u:any) => (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if (!user) return new Response("User not found", { status: 404 });

    await client.from("org_members").upsert({ org_id, user_id: user.id, role: role || "viewer" });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "Error", { status: 500 });
  }
});
