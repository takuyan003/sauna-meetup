import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug, updateEvent, deleteEvent } from "@/lib/store";
import type { CreateEventInput } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  // adminTokenはGETでは返さない
  const { adminToken: _, ...safeEvent } = event;
  return NextResponse.json(safeEvent);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body: CreateEventInput & { adminToken: string } = await request.json();

  if (!body.adminToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const success = await updateEvent(slug, body.adminToken, body);
  if (!success) {
    return NextResponse.json({ error: "権限がないか、イベントが見つかりません" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body: { adminToken: string } = await request.json();

  if (!body.adminToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const success = await deleteEvent(slug, body.adminToken);
  if (!success) {
    return NextResponse.json({ error: "権限がないか、イベントが見つかりません" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
