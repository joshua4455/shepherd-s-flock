/// <reference lib="dom" />

// Minimal declarations so the app TS server doesn't error on Supabase Edge Functions.
// Supabase executes functions in Deno, not in the Vite/Node TS environment.

declare namespace Deno {
  function envGet(key: string): string | undefined;
  namespace env {
    function get(key: string): string | undefined;
  }
}

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}
