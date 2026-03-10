import { NextRequest, NextResponse } from "next/server";
import { addResponse, updateResponse, deleteResponse, getEventBySlug } from "@/lib/store";
import type { CreateResponseInput } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body: CreateResponseInput = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  const participant = await addResponse(slug, body);

  if (!participant) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(participant, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { participantId, adminToken, ...input } = body;

  if (!participantId) {
    return NextResponse.json({ error: "参加者IDが必要です" }, { status: 400 });
  }
  if (!input.name?.trim()) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  // 管理者トークンがある場合は管理者権限で更新可能
  if (adminToken) {
    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
    }
  }

  const participant = await updateResponse(slug, participantId, input);
  if (!participant) {
    return NextResponse.json({ error: "参加者が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(participant);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { participantId } = body;

  if (!participantId) {
    return NextResponse.json({ error: "参加者IDが必要です" }, { status: 400 });
  }

  const success = await deleteResponse(slug, participantId);
  if (!success) {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
