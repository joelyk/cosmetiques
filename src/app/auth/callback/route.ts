import { NextResponse } from "next/server";

import { createSupabaseServerAuthClient } from "@/lib/supabase-auth-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/account";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin),
    );
  }

  try {
    const supabase = await createSupabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_link", requestUrl.origin),
      );
    }

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", requestUrl.origin),
    );
  }
}
