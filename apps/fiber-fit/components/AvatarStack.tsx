"use client";

import { initials, tintFor } from "@/lib/time";

export function Avatar({
  name,
  size = 32,
  ring = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium text-void ${ring ? "ring-1 ring-lime" : "ring-1 ring-void"}`}
      style={{
        width: size,
        height: size,
        background: tintFor(name),
        fontSize: size < 28 ? 9 : 11,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export default function AvatarStack({
  names,
  max = 5,
}: {
  names: string[];
  max?: number;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <span key={`${n}-${i}`} className="relative" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}>
          <Avatar name={n} size={28} />
        </span>
      ))}
      {extra > 0 ? (
        <span className="relative z-0 ml-[-8px] inline-flex h-7 w-7 items-center justify-center rounded-full bg-panel text-[10px] font-medium text-fog ring-1 ring-void">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
