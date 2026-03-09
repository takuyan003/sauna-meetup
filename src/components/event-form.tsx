"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateCandidate {
  date: string;
  timeLabel: string;
}

interface FacilityCandidate {
  name: string;
  address: string;
  url: string;
}

export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState<DateCandidate[]>([{ date: "", timeLabel: "" }]);
  const [facilities, setFacilities] = useState<FacilityCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addDate = () => setDates([...dates, { date: "", timeLabel: "" }]);
  const removeDate = (i: number) => setDates(dates.filter((_, idx) => idx !== i));
  const updateDate = (i: number, field: keyof DateCandidate, value: string) => {
    const next = [...dates];
    next[i] = { ...next[i], [field]: value };
    setDates(next);
  };

  const addFacility = () => setFacilities([...facilities, { name: "", address: "", url: "" }]);
  const removeFacility = (i: number) => setFacilities(facilities.filter((_, idx) => idx !== i));
  const updateFacility = (i: number, field: keyof FacilityCandidate, value: string) => {
    const next = [...facilities];
    next[i] = { ...next[i], [field]: value };
    setFacilities(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const validDates = dates.filter((d) => d.date);
    if (validDates.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dates: validDates,
          facilities: facilities.filter((f) => f.name.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/event/${data.slug}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* イベント基本情報 */}
      <Card className="border-sky-200">
        <CardHeader>
          <CardTitle className="text-sky-900 flex items-center gap-2">
            <span>♨</span> イベント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sky-800">
              イベント名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="例: 第3回サウナ部オフ会"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-sky-300 focus-visible:ring-sky-400"
              required
            />
          </div>
          <div>
            <Label htmlFor="desc" className="text-sky-800">メモ</Label>
            <Textarea
              id="desc"
              placeholder="例: 集合場所や注意事項など"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-sky-300 focus-visible:ring-sky-400"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 候補日時 */}
      <Card className="border-sky-200">
        <CardHeader>
          <CardTitle className="text-sky-900">候補日時 <span className="text-red-500">*</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dates.map((d, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sky-800 text-sm">日付</Label>
                <Input
                  type="date"
                  value={d.date}
                  onChange={(e) => updateDate(i, "date", e.target.value)}
                  className="border-sky-300 focus-visible:ring-sky-400"
                  required
                />
              </div>
              <div className="flex-1">
                <Label className="text-sky-800 text-sm">時間帯（任意）</Label>
                <Input
                  placeholder="例: 14:00〜"
                  value={d.timeLabel}
                  onChange={(e) => updateDate(i, "timeLabel", e.target.value)}
                  className="border-sky-300 focus-visible:ring-sky-400"
                />
              </div>
              {dates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDate(i)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 mb-0.5"
                >
                  削除
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDate}
            className="border-sky-300 text-sky-700 hover:bg-sky-50"
          >
            + 候補日を追加
          </Button>
        </CardContent>
      </Card>

      {/* 候補施設 */}
      <Card className="border-sky-200">
        <CardHeader>
          <CardTitle className="text-sky-900">候補サウナ施設（任意）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {facilities.length === 0 && (
            <p className="text-sm text-sky-600">
              行きたいサウナ施設の候補があれば追加してください。参加者が投票できます。
            </p>
          )}
          {facilities.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-sky-50 border border-sky-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-sky-800">施設 {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFacility(i)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7"
                >
                  削除
                </Button>
              </div>
              <Input
                placeholder="施設名"
                value={f.name}
                onChange={(e) => updateFacility(i, "name", e.target.value)}
                className="border-sky-300 focus-visible:ring-sky-400"
              />
              <Input
                placeholder="住所（任意）"
                value={f.address}
                onChange={(e) => updateFacility(i, "address", e.target.value)}
                className="border-sky-300 focus-visible:ring-sky-400"
              />
              <Input
                placeholder="URL（任意）"
                value={f.url}
                onChange={(e) => updateFacility(i, "url", e.target.value)}
                className="border-sky-300 focus-visible:ring-sky-400"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFacility}
            className="border-sky-300 text-sky-700 hover:bg-sky-50"
          >
            + 施設を追加
          </Button>
        </CardContent>
      </Card>

      {/* 作成ボタン */}
      <Button
        type="submit"
        disabled={submitting || !title.trim() || dates.every((d) => !d.date)}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white text-lg py-6 cursor-pointer"
      >
        {submitting ? "作成中..." : "イベントを作成する"}
      </Button>
    </form>
  );
}
