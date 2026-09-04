"use client";

import type { DayMark } from "@/lib/types";
import DayCell from "./DayCell";

export default function DayStrip({
  marks,
  onDay,
}: {
  marks: DayMark[];
  onDay?: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[3px]">
      {marks.map((m, i) => (
        <DayCell key={i} mark={m} size={11} onClick={onDay ? () => onDay(i) : undefined} />
      ))}
    </div>
  );
}
