import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_DOCUMENT_BYTES = 1_000_000;
const EMPTY_DOCUMENT = { study: null, knownWordIds: [] };

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await db.query<{ data: unknown; revision: string }>(
      "SELECT data, revision FROM public.user_app_data WHERE user_id = $1",
      [userId],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ data: EMPTY_DOCUMENT, revision: 0 });
    }
    return NextResponse.json({ data: result.rows[0].data, revision: Number(result.rows[0].revision) });
  } catch (error) {
    console.error("Study data read failed", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Unable to load study data." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Study data is too large." }, { status: 413 });
    }
    const body = await request.json().catch(() => null) as { data?: unknown; expectedRevision?: unknown } | null;
    if (!body || !body.data || typeof body.data !== "object" || Array.isArray(body.data) ||
      !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) {
      return NextResponse.json({ error: "Invalid study data or revision." }, { status: 400 });
    }
    const serialized = JSON.stringify(body.data);
    if (Buffer.byteLength(serialized, "utf8") > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Study data is too large." }, { status: 413 });
    }

    const result = await db.query<{ revision: string }>(
      `INSERT INTO public.user_app_data (user_id, schema_version, data, revision, updated_at)
       SELECT $1, 1, $2::jsonb, 1, now() WHERE $3 = 0
       ON CONFLICT (user_id) DO UPDATE
       SET data = EXCLUDED.data, schema_version = 1,
           revision = public.user_app_data.revision + 1, updated_at = now()
       WHERE public.user_app_data.revision = $3
       RETURNING revision`,
      [userId, serialized, Number(body.expectedRevision)],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Study data changed on another device. Reload before saving." }, { status: 409 });
    }
    return NextResponse.json({ revision: Number(result.rows[0].revision) });
  } catch (error) {
    console.error("Study data write failed", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Unable to save study data." }, { status: 503 });
  }
}
