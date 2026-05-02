import { NextResponse } from "next/server";

import { getAdminEntryPath } from "@/lib/admin-entry";
import { createSupabaseServerAuthClient } from "@/lib/supabase-auth-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/admin";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        getAdminEntryPath({ error: "missing_code", next: safeNext }),
        requestUrl.origin,
      ),
    );
  }

  try {
    const supabase = await createSupabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(
          getAdminEntryPath({ error: "invalid_link", next: safeNext }),
          requestUrl.origin,
        ),
      );
    }

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  } catch {
    return NextResponse.redirect(
      new URL(
        getAdminEntryPath({ error: "invalid_link", next: safeNext }),
        requestUrl.origin,
      ),
    );
  }
}
