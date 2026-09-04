"use client";

import type { DayMark } from "@/lib/types";

export default function DayCell({
  mark,
  size = 13,
  onClick,
}: {
  mark: DayMark;
  size?: number;
  onClick?: () => void;
}) {
  const cls =
    mark === "sealed"
      ? "bg-lime"
      : mark === "missed"
        ? "bg-blood"
        : mark === "pending"
          ? "border border-lime pending-pulse"
          : "border border-hairline bg-transparent";

  const inner = (
    <span
      className={`inline-block rounded-[4px] ${cls}`}
      style={{ width: size, height: size }}
    />
  );

  if (!onClick) return inner;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[4px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-lime"
    >
      {inner}
    </button>
  );
}
