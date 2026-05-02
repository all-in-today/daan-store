import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "allin-admin-secret-key-change-in-production"
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin/dashboard");
  const isAdminApi = pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/login");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    if (isAdminPage) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "admin") throw new Error("not admin");
    return NextResponse.next();
  } catch {
    if (isAdminPage) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*", "/api/admin/:path*"],
};
