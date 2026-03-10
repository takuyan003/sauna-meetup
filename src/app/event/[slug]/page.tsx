"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "@/components/schedule-grid";
import { ResponseForm } from "@/components/response-form";
import type { Event } from "@/lib/types";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      } else {
        setError("イベントが見つかりません");
      }
    } catch {
      setError("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    const token = localStorage.getItem(`admin_token_${slug}`);
    setIsAdmin(!!token);
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？この操作は取り消せません。")) return;
    const token = localStorage.getItem(`admin_token_${slug}`);
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: token }),
      });
      if (res.ok) {
        localStorage.removeItem(`admin_token_${slug}`);
        router.push("/");
      }
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-sky-600 text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error || "イベントが見つかりません"}</div>
        <a href="/" className="text-sky-600 hover:underline mt-4 inline-block">
          トップに戻る
        </a>
      </div>
    );
  }

  // 最も○が多い日付
  const bestDate = event.dates.length > 0
    ? event.dates.reduce((best, d) => {
        const okCount = event.participants.filter((p) =>
          p.dateResponses.some((r) => r.eventDateId === d.id && r.response === "○")
        ).length;
        const bestCount = event.participants.filter((p) =>
          p.dateResponses.some((r) => r.eventDateId === best.id && r.response === "○")
        ).length;
        return okCount > bestCount ? d : best;
      })
    : null;

  // 最も投票が多い施設
  const bestFacility = event.facilities.length > 0
    ? [...event.facilities].sort((a, b) => b.votes - a.votes)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* イベント情報 */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-sky-900 mb-2">{event.title}</h1>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/event/${slug}/edit`)}
                className="border-sky-300 text-sky-700 hover:bg-sky-50 cursor-pointer"
              >
                編集
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                {deleting ? "削除中..." : "削除"}
              </Button>
            </div>
          )}
        </div>
        {event.description && (
          <p className="text-sky-700 whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      {/* URL共有 */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm text-sky-700 mb-1">このURLをメンバーに共有してください</p>
              <p className="text-xs text-sky-600 font-mono break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </div>
            <Button
              onClick={copyUrl}
              variant="outline"
              size="sm"
              className="border-sky-300 text-sky-700 hover:bg-sky-100 shrink-0 cursor-pointer"
            >
              {copied ? "コピー済!" : "URLをコピー"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* サマリー */}
      {event.participants.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="border-sky-300 text-sky-700 text-sm py-1 px-3">
            回答: {event.participants.length}人
          </Badge>
          {bestDate && (
            <Badge className="bg-green-100 text-green-800 text-sm py-1 px-3">
              最有力: {(() => {
                const d = new Date(bestDate.date + "T00:00:00");
                const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
                return `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
              })()}
              {bestDate.timeLabel && ` ${bestDate.timeLabel}`}
            </Badge>
          )}
          {bestFacility && bestFacility.votes > 0 && (
            <Badge className="bg-sky-100 text-sky-800 text-sm py-1 px-3">
              人気施設: {bestFacility.name}({bestFacility.votes}票)
            </Badge>
          )}
        </div>
      )}

      {/* 日程調整グリッド */}
      <Card className="border-sky-200">
        <CardHeader>
          <CardTitle className="text-sky-900">日程調整</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleGrid event={event} />
        </CardContent>
      </Card>

      {/* 施設一覧 */}
      {event.facilities.length > 0 && (
        <Card className="border-sky-200">
          <CardHeader>
            <CardTitle className="text-sky-900">候補施設</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...event.facilities]
              .sort((a, b) => b.votes - a.votes)
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200"
                >
                  <span className="text-xl">♨</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sky-900">{f.name}</div>
                    {f.address && <div className="text-sm text-sky-600">{f.address}</div>}
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        詳細を見る
                      </a>
                    )}
                  </div>
                  <Badge className="bg-sky-500 text-white">{f.votes} 票</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* コメント一覧 */}
      {event.participants.some((p) => p.comment) && (
        <Card className="border-sky-200">
          <CardHeader>
            <CardTitle className="text-sky-900">コメント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {event.participants
              .filter((p) => p.comment)
              .map((p) => (
                <div key={p.id} className="p-2 rounded bg-sky-50">
                  <span className="font-medium text-sky-900">{p.name}</span>
                  <span className="text-sky-600 mx-2">:</span>
                  <span className="text-sky-800">{p.comment}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* 回答フォーム */}
      <ResponseForm event={event} onSubmitted={fetchEvent} />
    </div>
  );
}
