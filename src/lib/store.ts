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

  const { data: event, error: eventErr } = await supabase!
    .from("events")
    .insert({ slug, title: input.title, description: input.description })
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
  };
  memoryEvents.set(slug, event);
  return event;
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

export async function addResponse(
  slug: string,
  input: CreateResponseInput
): Promise<Participant | null> {
  if (isSupabaseConfigured) return addResponseSupabase(slug, input);
  return addResponseMemory(slug, input);
}
