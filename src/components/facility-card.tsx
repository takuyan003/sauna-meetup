"use client";

import type { EventFacility } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FacilityCardProps {
  facility: EventFacility;
  voted: boolean;
  onToggleVote: (id: string) => void;
}

export function FacilityCard({ facility, voted, onToggleVote }: FacilityCardProps) {
  return (
    <Card
      className={`border transition-colors cursor-pointer ${
        voted
          ? "border-sky-400 bg-sky-50"
          : "border-sky-200 hover:border-sky-300"
      }`}
      onClick={() => onToggleVote(facility.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">♨</span>
              <h3 className="font-medium text-sky-900 truncate">{facility.name}</h3>
            </div>
            {facility.address && (
              <p className="text-sm text-sky-600 truncate">{facility.address}</p>
            )}
            {facility.url && (
              <a
                href={facility.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                詳細を見る
              </a>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge
              variant={voted ? "default" : "outline"}
              className={voted
                ? "bg-sky-500 hover:bg-sky-600"
                : "border-sky-300 text-sky-700"
              }
            >
              {voted ? "投票済" : "投票"}
            </Badge>
            <span className="text-sm text-sky-600">{facility.votes} 票</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
