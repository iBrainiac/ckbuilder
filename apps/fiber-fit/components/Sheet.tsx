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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-void/55 backdrop-blur-sm md:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="glass-pane relative z-10 w-full max-w-[430px] rounded-t-[28px] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 md:mb-0 md:max-h-[90dvh] md:overflow-y-auto md:rounded-[28px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline md:hidden" />
        <h2 className="text-[15px] font-semibold text-paper">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
