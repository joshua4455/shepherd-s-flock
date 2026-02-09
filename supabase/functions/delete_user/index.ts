/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  "";

const PROFILES_TABLE = Deno.env.get("PROFILES_TABLE") || "profiles";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY (Dashboard Secrets) or SERVICE_ROLE_KEY (custom secret).",
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

type DeleteUserBody = {
  userId: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    if (!jwt) return json(401, { error: "Missing Authorization header" });

    const { data: caller, error: callerErr } = await sb.auth.getUser(jwt);
    if (callerErr) return json(401, { error: "Invalid session", detail: callerErr.message });
    const callerId = caller.user?.id;
    if (!callerId) return json(401, { error: "Invalid session" });

    const { data: callerProfile, error: profErr } = await sb
      .from(PROFILES_TABLE)
      .select("role")
      .eq("id", callerId)
      .maybeSingle();
    if (profErr) return json(500, { error: profErr.message });

    const callerRole = (callerProfile?.role ?? "").toString().toLowerCase();
    if (callerRole !== "admin") return json(403, { error: "Only admins can delete users" });

    const body = (await req.json()) as Partial<DeleteUserBody>;
    const userId = (body.userId || "").trim();
    if (!userId) return json(400, { error: "Missing userId" });

    if (userId === callerId) return json(400, { error: "You cannot delete your own account" });

    const { data: targetProfile, error: targetSelErr } = await sb
      .from(PROFILES_TABLE)
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (targetSelErr) return json(500, { error: targetSelErr.message });

    const targetRole = (targetProfile?.role ?? "").toString().toLowerCase();
    if (targetRole === "admin") return json(400, { error: "Admin accounts cannot be deleted" });

    const { error: delProfileErr } = await sb.from(PROFILES_TABLE).delete().eq("id", userId);
    if (delProfileErr) return json(400, { error: delProfileErr.message });

    const { error: delAuthErr } = await sb.auth.admin.deleteUser(userId);
    if (delAuthErr) return json(400, { error: delAuthErr.message });

    return json(200, { ok: true });
  } catch (e: any) {
    console.error(e);
    return json(500, { error: "Server error" });
  }
});
