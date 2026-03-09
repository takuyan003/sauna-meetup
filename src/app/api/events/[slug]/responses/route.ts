import { NextRequest, NextResponse } from "next/server";
import { addResponse } from "@/lib/store";
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
