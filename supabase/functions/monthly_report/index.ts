// supabase/functions/monthly_report/index.ts
// Runs monthly and stores a snapshot + posts an in-app notification
// Env (Project Settings -> Functions):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY
// Optional:
//  - CREATED_TIMESTAMP_COLUMN (default: created_at; set to createdAt if camelCase)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CREATED_COL = Deno.env.get("CREATED_TIMESTAMP_COLUMN") || "created_at";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function lastMonthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1, 0, 0, 0));
  const prevEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
  return { start, end, prevStart, prevEnd };
}

async function countInRange(table: string, startISO: string, endISO: string) {
  const { error, count } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(CREATED_COL, startISO)
    .lt(CREATED_COL, endISO);
  if (error) throw error;
  return count ?? 0;
}

// no email delivery; we store and notify in-app

serve(async () => {
  try {
    const { start, end, prevStart, prevEnd } = lastMonthBounds();
    const iso = (d: Date) => d.toISOString();

    const [membersCurr, membersPrev] = await Promise.all([
      countInRange("members", iso(start), iso(end)),
      countInRange("members", iso(prevStart), iso(prevEnd)),
    ]);
    const [visitorsCurr, visitorsPrev] = await Promise.all([
      countInRange("visitors", iso(start), iso(end)),
      countInRange("visitors", iso(prevStart), iso(prevEnd)),
    ]);
    const [convertsCurr, convertsPrev] = await Promise.all([
      countInRange("converts", iso(start), iso(end)),
      countInRange("converts", iso(prevStart), iso(prevEnd)),
    ]);

    const monthLabel = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    // Store snapshot for this month
    const monthStartISO = start.toISOString().split("T")[0];
    const snapshot = {
      month_start: monthStartISO,
      members_curr: membersCurr,
      visitors_curr: visitorsCurr,
      converts_curr: convertsCurr,
      members_prev: membersPrev,
      visitors_prev: visitorsPrev,
      converts_prev: convertsPrev,
      created_at: new Date().toISOString(),
    };

    const up = await sb
      .from("monthly_report_snapshots")
      .upsert(snapshot, { onConflict: "month_start" });
    if (up.error) throw up.error;

    // Post in-app notification if enabled by any user
    const { count: enabledCount, error: enabledErr } = await sb
      .from("notification_prefs")
      .select("*", { count: "exact", head: true })
      .eq("monthly_reports", true);
    if (enabledErr) throw enabledErr;

    if ((enabledCount ?? 0) > 0) {
      const ins = await sb.from("notification_feed").insert({
        title: "Monthly report ready",
        message: `View the report for ${monthLabel}`,
        ts: new Date().toISOString(),
        read: false,
      });
      if (ins.error) throw ins.error;
    }

    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});
