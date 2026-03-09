"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilityCard } from "./facility-card";
import type { Event, DateResponse } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  return `${month}/${day}(${weekday})`;
}

const responseOptions: { value: DateResponse["response"]; label: string; color: string }[] = [
  { value: "○", label: "○", color: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" },
  { value: "△", label: "△", color: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200" },
  { value: "×", label: "×", color: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" },
];

interface ResponseFormProps {
  event: Event;
  onSubmitted: () => void;
}

export function ResponseForm({ event, onSubmitted }: ResponseFormProps) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [responses, setResponses] = useState<Record<string, DateResponse["response"]>>(
    Object.fromEntries(event.dates.map((d) => [d.id, "○" as const]))
  );
  const [facilityVotes, setFacilityVotes] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const setResponse = (dateId: string, value: DateResponse["response"]) => {
    setResponses((prev) => ({ ...prev, [dateId]: value }));
  };

  const toggleFacilityVote = (facilityId: string) => {
    setFacilityVotes((prev) => {
      const next = new Set(prev);
      if (next.has(facilityId)) next.delete(facilityId);
      else next.add(facilityId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          comment: comment.trim(),
          dateResponses: Object.entries(responses).map(([eventDateId, response]) => ({
            eventDateId,
            response,
          })),
          facilityVotes: Array.from(facilityVotes),
        }),
      });
      if (res.ok) {
        setName("");
        setComment("");
        setResponses(Object.fromEntries(event.dates.map((d) => [d.id, "○" as const])));
        setFacilityVotes(new Set());
        onSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-sky-200">
        <CardHeader>
          <CardTitle className="text-sky-900">出欠を入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sky-800">
              名前 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="あなたの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-sky-300 focus-visible:ring-sky-400"
              required
            />
          </div>

          {/* 日程回答 */}
          <div className="space-y-3">
            <Label className="text-sky-800">日程</Label>
            {event.dates.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <div className="min-w-[100px] text-sm text-sky-900">
                  <div className="font-medium">{formatDate(d.date)}</div>
                  {d.timeLabel && <div className="text-xs text-sky-600">{d.timeLabel}</div>}
                </div>
                <div className="flex gap-1">
                  {responseOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResponse(d.id, opt.value)}
                      className={`w-10 h-10 rounded-lg border text-lg font-bold transition-all cursor-pointer ${
                        responses[d.id] === opt.value
                          ? `${opt.color} ring-2 ring-offset-1 ring-sky-400 scale-110`
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 施設投票 */}
          {event.facilities.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sky-800">行きたい施設に投票（複数可）</Label>
              {event.facilities.map((f) => (
                <FacilityCard
                  key={f.id}
                  facility={f}
                  voted={facilityVotes.has(f.id)}
                  onToggleVote={toggleFacilityVote}
                />
              ))}
            </div>
          )}

          {/* コメント */}
          <div>
            <Label htmlFor="comment" className="text-sky-800">コメント（任意）</Label>
            <Textarea
              id="comment"
              placeholder="ひとこと"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-sky-300 focus-visible:ring-sky-400"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
          >
            {submitting ? "送信中..." : "回答する"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
