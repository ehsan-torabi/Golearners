import { NextResponse, type NextRequest } from "next/server";

/* Server components cannot read the pathname, so middleware hands it over as a
   request header — the login page needs it to build the ?next= return path. */
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
