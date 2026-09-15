"use client";

import type { ReactNode } from "react";

export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-void" aria-hidden>
      <div className="app-orb app-orb-a" />
      <div className="app-orb app-orb-b" />
      <div className="app-orb app-orb-c hidden sm:block" />
    </div>
  );
}

export function AppShell({
  sidebar,
  header,
  children,
  footer,
}: {
  sidebar?: ReactNode;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <Ambient />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col md:max-w-[720px] md:px-5 md:py-6 lg:max-w-[1120px] lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-7">
        {sidebar ? (
          <aside className="glass-pane hidden w-[232px] shrink-0 flex-col rounded-[28px] p-5 lg:flex lg:min-h-[calc(100dvh-3.5rem)]">
            {sidebar}
          </aside>
        ) : null}
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:min-h-[calc(100dvh-48px)] md:overflow-hidden md:rounded-[28px] md:glass-pane lg:min-h-0">
          <header className="app-shell-header glass-bar sticky top-0 z-20 flex items-center justify-between gap-3 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top))] md:static md:pt-5">
            {header}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <Ambient />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-[calc(14px+env(safe-area-inset-top))] md:max-w-[520px] md:justify-center md:py-10">
        <div className="flex min-h-0 flex-1 flex-col md:min-h-0 md:flex-none md:rounded-[28px] md:glass-pane md:px-7 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
