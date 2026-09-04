"use client";

import type { ReactNode } from "react";

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-void/70">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-[28px] border border-hairline bg-panel px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline" />
        <h2 className="text-[15px] font-semibold text-paper">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
