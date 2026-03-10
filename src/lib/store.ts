import type { Event, CreateEventInput, CreateResponseInput, Participant } from "./types";
import { nanoid } from "nanoid";
import { supabase, isSupabaseConfigured } from "./supabase";

// ============================================================
// In-memory fallback (Supabase未接続時)
// ============================================================
const memoryEvents = new Map<string, Event>();

function generateSlug(): string {
  return nanoid(8);
}

// ============================================================
// Supabase版
// ============================================================
async function createEventSupabase(input: CreateEventInput): Promise<Event> {
  const slug = generateSlug();
  const adminToken = nanoid(16);

  const { data: event, error: eventErr } = await supabase!
    .from("events")
    .insert({ slug, title: input.title, description: input.description, admin_token: adminToken })
    .select()
    .single();
  if (eventErr) throw eventErr;

  const dates = input.dates.map((d) => ({
    event_id: event.id,
    date: d.date,
    time_label: d.timeLabel,
  }));
  const { data: insertedDates } = await supabase!
    .from("event_dates")
    .insert(dates)
    .select();

  const facilities = input.facilities
    .filter((f) => f.name.trim())
    .map((f) => ({
      event_id: event.id,
      name: f.name,
      address: f.address,
      url: f.url,
    }));
  const { data: insertedFacilities } = await supabase!
    .from("event_facilities")
    .insert(facilities)
    .select();

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description || "",
    dates: (insertedDates || []).map((d: Record<string, string>) => ({
      id: d.id,
      eventId: d.event_id,
      date: d.date,
      timeLabel: d.time_label || "",
    })),
    facilities: (insertedFacilities || []).map((f: Record<string, string>) => ({
      id: f.id,
      eventId: f.event_id,
      name: f.name,
      address: f.address || "",
      url: f.url || "",
      votes: 0,
    })),
    participants: [],
    createdAt: event.created_at,
    adminToken,
  };
}

async function getEventBySlugSupabase(slug: string): Promise<Event | undefined> {
  const { data: event } = await supabase!
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!event) return undefined;

  const { data: dates } = await supabase!
    .from("event_dates")
    .select("*")
    .eq("event_id", event.id)
    .order("date");

  const { data: facilities } = await supabase!
    .from("event_facilities")
    .select("*")
    .eq("event_id", event.id);

  const { data: participants } = await supabase!
    .from("participants")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at");

  const participantList: Participant[] = [];
  for (const p of participants || []) {
    const { data: responses } = await supabase!
      .from("date_responses")
      .select("*")
      .eq("participant_id", p.id);

    const { data: votes } = await supabase!
      .from("facility_votes")
      .select("event_facility_id")
      .eq("participant_id", p.id);

    participantList.push({
      id: p.id,
      eventId: p.event_id,
      name: p.name,
      comment: p.comment || "",
      dateResponses: (responses || []).map((r: Record<string, string>) => ({
        eventDateId: r.event_date_id,
        response: r.response as "○" | "△" | "×",
      })),
      facilityVotes: (votes || []).map((v: Record<string, string>) => v.event_facility_id),
      createdAt: p.created_at,
    });
  }

  // 施設の投票数を集計
  const facilitiesWithVotes = (facilities || []).map((f: Record<string, string>) => {
    const voteCount = participantList.filter((p) =>
      p.facilityVotes.includes(f.id)
    ).length;
    return {
      id: f.id,
      eventId: f.event_id,
      name: f.name,
      address: f.address || "",
      url: f.url || "",
      votes: voteCount,
    };
  });

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description || "",
    dates: (dates || []).map((d: Record<string, string>) => ({
      id: d.id,
      eventId: d.event_id,
      date: d.date,
      timeLabel: d.time_label || "",
    })),
    facilities: facilitiesWithVotes,
    participants: participantList,
    createdAt: event.created_at,
  };
}

async function updateEventSupabase(
  slug: string,
  adminToken: string,
  input: CreateEventInput
): Promise<boolean> {
  const { data: event } = await supabase!
    .from("events")
    .select("id, admin_token")
    .eq("slug", slug)
    .single();
  if (!event || event.admin_token !== adminToken) return false;

  await supabase!
    .from("events")
    .update({ title: input.title, description: input.description })
    .eq("id", event.id);

  // 日付を差し替え
  await supabase!.from("event_dates").delete().eq("event_id", event.id);
  if (input.dates.length > 0) {
    await supabase!.from("event_dates").insert(
      input.dates.map((d) => ({
        event_id: event.id,
        date: d.date,
        time_label: d.timeLabel,
      }))
    );
  }

  // 施設を差し替え
  await supabase!.from("event_facilities").delete().eq("event_id", event.id);
  const validFacilities = input.facilities.filter((f) => f.name.trim());
  if (validFacilities.length > 0) {
    await supabase!.from("event_facilities").insert(
      validFacilities.map((f) => ({
        event_id: event.id,
        name: f.name,
        address: f.address,
        url: f.url,
      }))
    );
  }

  return true;
}

async function deleteEventSupabase(slug: string, adminToken: string): Promise<boolean> {
  const { data: event } = await supabase!
    .from("events")
    .select("id, admin_token")
    .eq("slug", slug)
    .single();
  if (!event || event.admin_token !== adminToken) return false;

  await supabase!.from("events").delete().eq("id", event.id);
  return true;
}

async function addResponseSupabase(
  slug: string,
  input: CreateResponseInput
): Promise<Participant | null> {
  const { data: event } = await supabase!
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!event) return null;

  const { data: participant, error: pErr } = await supabase!
    .from("participants")
    .insert({
      event_id: event.id,
      name: input.name,
      comment: input.comment,
    })
    .select()
    .single();
  if (pErr) throw pErr;

  if (input.dateResponses.length > 0) {
    await supabase!.from("date_responses").insert(
      input.dateResponses.map((dr) => ({
        participant_id: participant.id,
        event_date_id: dr.eventDateId,
        response: dr.response,
      }))
    );
  }

  if (input.facilityVotes.length > 0) {
    await supabase!.from("facility_votes").insert(
      input.facilityVotes.map((fid) => ({
        participant_id: participant.id,
        event_facility_id: fid,
      }))
    );
  }

  return {
    id: participant.id,
    eventId: event.id,
    name: participant.name,
    comment: participant.comment || "",
    dateResponses: input.dateResponses,
    facilityVotes: input.facilityVotes,
    createdAt: participant.created_at,
  };
}

// ============================================================
// In-memory fallback版
// ============================================================
function createEventMemory(input: CreateEventInput): Event {
  const id = nanoid();
  const slug = generateSlug();
  const adminToken = nanoid(16);
  const event: Event = {
    id,
    slug,
    title: input.title,
    description: input.description,
    dates: input.dates.map((d) => ({
      id: nanoid(),
      eventId: id,
      date: d.date,
      timeLabel: d.timeLabel,
    })),
    facilities: input.facilities
      .filter((f) => f.name.trim())
      .map((f) => ({
        id: nanoid(),
        eventId: id,
        name: f.name,
        address: f.address,
        url: f.url,
        votes: 0,
      })),
    participants: [],
    createdAt: new Date().toISOString(),
    adminToken,
  };
  memoryEvents.set(slug, event);
  return event;
}

function updateEventMemory(slug: string, adminToken: string, input: CreateEventInput): boolean {
  const event = memoryEvents.get(slug);
  if (!event || event.adminToken !== adminToken) return false;
  event.title = input.title;
  event.description = input.description;
  event.dates = input.dates.map((d) => ({
    id: nanoid(),
    eventId: event.id,
    date: d.date,
    timeLabel: d.timeLabel,
  }));
  event.facilities = input.facilities
    .filter((f) => f.name.trim())
    .map((f) => ({
      id: nanoid(),
      eventId: event.id,
      name: f.name,
      address: f.address,
      url: f.url,
      votes: 0,
    }));
  return true;
}

function deleteEventMemory(slug: string, adminToken: string): boolean {
  const event = memoryEvents.get(slug);
  if (!event || event.adminToken !== adminToken) return false;
  memoryEvents.delete(slug);
  return true;
}

function addResponseMemory(slug: string, input: CreateResponseInput): Participant | null {
  const event = memoryEvents.get(slug);
  if (!event) return null;
  const participant: Participant = {
    id: nanoid(),
    eventId: event.id,
    name: input.name,
    comment: input.comment,
    dateResponses: input.dateResponses,
    facilityVotes: input.facilityVotes,
    createdAt: new Date().toISOString(),
  };
  event.participants.push(participant);
  for (const fid of input.facilityVotes) {
    const f = event.facilities.find((x) => x.id === fid);
    if (f) f.votes++;
  }
  return participant;
}

// ============================================================
// 参加者回答更新 (Supabase)
// ============================================================
async function updateResponseSupabase(
  slug: string,
  participantId: string,
  input: CreateResponseInput
): Promise<Participant | null> {
  const { data: event } = await supabase!
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!event) return null;

  // 参加者が存在するか確認
  const { data: participant } = await supabase!
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .eq("event_id", event.id)
    .single();
  if (!participant) return null;

  // 名前・コメント更新
  await supabase!
    .from("participants")
    .update({ name: input.name, comment: input.comment })
    .eq("id", participantId);

  // 日程回答を差し替え
  await supabase!.from("date_responses").delete().eq("participant_id", participantId);
  if (input.dateResponses.length > 0) {
    await supabase!.from("date_responses").insert(
      input.dateResponses.map((dr) => ({
        participant_id: participantId,
        event_date_id: dr.eventDateId,
        response: dr.response,
      }))
    );
  }

  // 施設投票を差し替え
  await supabase!.from("facility_votes").delete().eq("participant_id", participantId);
  if (input.facilityVotes.length > 0) {
    await supabase!.from("facility_votes").insert(
      input.facilityVotes.map((fid) => ({
        participant_id: participantId,
        event_facility_id: fid,
      }))
    );
  }

  return {
    id: participantId,
    eventId: event.id,
    name: input.name,
    comment: input.comment,
    dateResponses: input.dateResponses,
    facilityVotes: input.facilityVotes,
    createdAt: participant.created_at,
  };
}

async function deleteResponseSupabase(
  slug: string,
  participantId: string
): Promise<boolean> {
  const { data: event } = await supabase!
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!event) return false;

  const { error } = await supabase!
    .from("participants")
    .delete()
    .eq("id", participantId)
    .eq("event_id", event.id);
  return !error;
}

// ============================================================
// 参加者回答更新 (Memory)
// ============================================================
function updateResponseMemory(
  slug: string,
  participantId: string,
  input: CreateResponseInput
): Participant | null {
  const event = memoryEvents.get(slug);
  if (!event) return null;
  const participant = event.participants.find((p) => p.id === participantId);
  if (!participant) return null;

  // 施設投票を更新（古い分を減算、新しい分を加算）
  for (const fid of participant.facilityVotes) {
    const f = event.facilities.find((x) => x.id === fid);
    if (f) f.votes--;
  }
  for (const fid of input.facilityVotes) {
    const f = event.facilities.find((x) => x.id === fid);
    if (f) f.votes++;
  }

  participant.name = input.name;
  participant.comment = input.comment;
  participant.dateResponses = input.dateResponses;
  participant.facilityVotes = input.facilityVotes;
  return participant;
}

function deleteResponseMemory(slug: string, participantId: string): boolean {
  const event = memoryEvents.get(slug);
  if (!event) return false;
  const idx = event.participants.findIndex((p) => p.id === participantId);
  if (idx === -1) return false;
  const participant = event.participants[idx];
  for (const fid of participant.facilityVotes) {
    const f = event.facilities.find((x) => x.id === fid);
    if (f) f.votes--;
  }
  event.participants.splice(idx, 1);
  return true;
}

// ============================================================
// 統合エクスポート
// ============================================================
export async function createEvent(input: CreateEventInput): Promise<Event> {
  if (isSupabaseConfigured) return createEventSupabase(input);
  return createEventMemory(input);
}

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  if (isSupabaseConfigured) return getEventBySlugSupabase(slug);
  return memoryEvents.get(slug);
}

export async function updateEvent(
  slug: string,
  adminToken: string,
  input: CreateEventInput
): Promise<boolean> {
  if (isSupabaseConfigured) return updateEventSupabase(slug, adminToken, input);
  return updateEventMemory(slug, adminToken, input);
}

export async function deleteEvent(
  slug: string,
  adminToken: string
): Promise<boolean> {
  if (isSupabaseConfigured) return deleteEventSupabase(slug, adminToken);
  return deleteEventMemory(slug, adminToken);
}

export async function addResponse(
  slug: string,
  input: CreateResponseInput
): Promise<Participant | null> {
  if (isSupabaseConfigured) return addResponseSupabase(slug, input);
  return addResponseMemory(slug, input);
}

export async function updateResponse(
  slug: string,
  participantId: string,
  input: CreateResponseInput
): Promise<Participant | null> {
  if (isSupabaseConfigured) return updateResponseSupabase(slug, participantId, input);
  return updateResponseMemory(slug, participantId, input);
}

export async function deleteResponse(
  slug: string,
  participantId: string
): Promise<boolean> {
  if (isSupabaseConfigured) return deleteResponseSupabase(slug, participantId);
  return deleteResponseMemory(slug, participantId);
}
