"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventForm } from "@/components/event-form";
import type { Event } from "@/lib/types";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(`admin_token_${slug}`);
    if (!token) {
      router.push(`/event/${slug}`);
      return;
    }
    setAdminToken(token);

    fetch(`/api/events/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => {
        router.push(`/event/${slug}`);
      });
  }, [slug, router]);

  if (loading || !event || !adminToken) {
    return (
      <div className="text-center py-12">
        <div className="text-sky-600 text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-sky-900 mb-6">イベントを編集</h1>
      <EventForm editEvent={event} adminToken={adminToken} />
    </div>
  );
}
