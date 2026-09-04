import type { FiberKind } from "@/lib/types";

export default function FiberChip({
  fiber,
  selected,
}: {
  fiber: FiberKind;
  selected?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
        selected ? "border-lime text-lime" : "border-hairline text-fog"
      }`}
    >
      {fiber}
    </span>
  );
}
