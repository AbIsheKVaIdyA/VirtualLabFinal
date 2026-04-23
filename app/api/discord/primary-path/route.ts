import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PATHS = new Set(["python", "web", "data", "cyber"]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string | null };
    const raw = body.path?.toLowerCase().trim() ?? "";
    const path = raw.length > 0 ? raw : null;

    if (path && !ALLOWED_PATHS.has(path)) {
      return NextResponse.json(
        { ok: false, message: "Invalid primary path." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: path ? "Primary path updated." : "Primary path cleared.",
    });

    if (!path) {
      response.cookies.delete("vl_primary_path");
      return response;
    }

    response.cookies.set("vl_primary_path", path, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not set primary path." },
      { status: 500 }
    );
  }
}
