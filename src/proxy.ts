import { type NextRequest, NextResponse } from "next/server";

import { canonicalPath } from "@/lib/canonical-path";

export function proxy(request: NextRequest): NextResponse {
  const target = canonicalPath(request.nextUrl.pathname);

  if (!target) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  url.pathname = target;

  return NextResponse.redirect(url, 308);
}

// Rulează doar pe adresele cu majuscule; restul cererilor nu trec prin proxy.
export const config = {
  matcher: ["/((?!_next/|api/)[^?]*[A-Z][^?]*)"],
};
