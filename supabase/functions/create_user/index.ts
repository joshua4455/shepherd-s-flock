/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROFILES_TABLE = Deno.env.get("PROFILES_TABLE") || "profiles";

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

function randomPassword(len = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

type CreateUserBody = {
  name: string;
  email: string;
  role: "Admin" | "Leader";
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    if (!jwt) return json(401, { error: "Missing Authorization header" });

    const { data: caller, error: callerErr } = await sb.auth.getUser(jwt);
    if (callerErr) return json(401, { error: "Invalid session" });
    const callerId = caller.user?.id;
    if (!callerId) return json(401, { error: "Invalid session" });

    const { data: callerProfile, error: profErr } = await sb
      .from(PROFILES_TABLE)
      .select("role")
      .eq("id", callerId)
      .maybeSingle();
    if (profErr) return json(500, { error: profErr.message });

    const roleStr = (callerProfile?.role ?? "").toString().toLowerCase();
    if (roleStr !== "admin") return json(403, { error: "Only admins can create users" });

    const body = (await req.json()) as Partial<CreateUserBody>;
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const role = body.role;

    if (!name || !email || (role !== "Admin" && role !== "Leader")) {
      return json(400, { error: "Missing name/email/role" });
    }

    const password = randomPassword();

    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) return json(400, { error: createErr.message });
    const userId = created.user?.id;
    if (!userId) return json(500, { error: "User created but missing id" });

    const { error: profileErr } = await sb.from(PROFILES_TABLE).insert({
      id: userId,
      name,
      email,
      role,
    });

    if (profileErr) {
      await sb.auth.admin.deleteUser(userId);
      return json(400, { error: profileErr.message });
    }

    return json(200, { userId, temporaryPassword: password });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error" });
  }
});
