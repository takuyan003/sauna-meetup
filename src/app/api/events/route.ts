import { NextRequest, NextResponse } from "next/server";
import { createEvent } from "@/lib/store";
import type { CreateEventInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body: CreateEventInput = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "イベント名は必須です" }, { status: 400 });
  }
  if (!body.dates || body.dates.length === 0) {
    return NextResponse.json({ error: "候補日を1つ以上追加してください" }, { status: 400 });
  }

  const event = await createEvent(body);
  return NextResponse.json({ slug: event.slug, adminToken: event.adminToken }, { status: 201 });
}
