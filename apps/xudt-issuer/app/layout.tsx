import type { Metadata } from "next";
import "./globals.css";
import { LayoutProvider } from "./layoutProvider";

export const metadata: Metadata = {
  title: "xUDT Issuer",
  description: "Issue and transfer xUDT tokens on Nervos CKB",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
