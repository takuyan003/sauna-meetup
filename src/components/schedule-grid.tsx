"use client";

import type { Event } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  return `${month}/${day}(${weekday})`;
}

function getResponseColor(response: string): string {
  switch (response) {
    case "○": return "bg-green-100 text-green-800";
    case "△": return "bg-yellow-100 text-yellow-800";
    case "×": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-400";
  }
}

function getCountColor(count: number, total: number): string {
  if (total === 0) return "text-gray-400";
  const ratio = count / total;
  if (ratio >= 0.8) return "text-green-700 font-bold";
  if (ratio >= 0.5) return "text-yellow-700";
  return "text-red-700";
}

export function ScheduleGrid({ event }: { event: Event }) {
  const { dates, participants } = event;

  // 各日付の○の数を集計
  const dateSummary = dates.map((d) => {
    let ok = 0, maybe = 0, ng = 0;
    for (const p of participants) {
      const r = p.dateResponses.find((dr) => dr.eventDateId === d.id);
      if (r?.response === "○") ok++;
      else if (r?.response === "△") maybe++;
      else if (r?.response === "×") ng++;
    }
    return { ok, maybe, ng };
  });

  // 最も○が多い日付を特定
  const maxOk = Math.max(...dateSummary.map((s) => s.ok), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 p-2 border border-sky-200 text-left text-sky-800 min-w-[80px]">
              名前
            </th>
            {dates.map((d, i) => (
              <th
                key={d.id}
                className={`p-2 border border-sky-200 text-center min-w-[70px] ${
                  dateSummary[i].ok === maxOk && maxOk > 0
                    ? "bg-green-50"
                    : "bg-sky-50"
                }`}
              >
                <div className="text-sky-900 font-medium">{formatDate(d.date)}</div>
                {d.timeLabel && (
                  <div className="text-xs text-sky-600">{d.timeLabel}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td className="sticky left-0 bg-white z-10 p-2 border border-sky-200 font-medium text-sky-900">
                {p.name}
              </td>
              {dates.map((d) => {
                const r = p.dateResponses.find((dr) => dr.eventDateId === d.id);
                const response = r?.response ?? "-";
                return (
                  <td
                    key={d.id}
                    className={`p-2 border border-sky-200 text-center text-lg ${getResponseColor(response)}`}
                  >
                    {response}
                  </td>
                );
              })}
            </tr>
          ))}
          {participants.length === 0 && (
            <tr>
              <td
                colSpan={dates.length + 1}
                className="p-4 text-center text-sky-500 border border-sky-200"
              >
                まだ回答がありません
              </td>
            </tr>
          )}
        </tbody>
        {participants.length > 0 && (
          <tfoot>
            <tr className="bg-sky-50">
              <td className="sticky left-0 bg-sky-50 z-10 p-2 border border-sky-200 font-medium text-sky-800">
                集計
              </td>
              {dates.map((d, i) => {
                const s = dateSummary[i];
                return (
                  <td
                    key={d.id}
                    className={`p-2 border border-sky-200 text-center ${
                      s.ok === maxOk && maxOk > 0 ? "bg-green-50" : ""
                    }`}
                  >
                    <div className={getCountColor(s.ok, participants.length)}>
                      ○ {s.ok}
                    </div>
                    <div className="text-yellow-600 text-xs">△ {s.maybe}</div>
                    <div className="text-red-600 text-xs">× {s.ng}</div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
