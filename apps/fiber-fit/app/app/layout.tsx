import type { ReactNode } from "react";
import { LayoutProvider } from "../layoutProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <LayoutProvider>{children}</LayoutProvider>;
}
