import type { Metadata } from "next";

import { geistMono, geistSans } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "Learn AI Agents",
  description: "Learn modern AI-agent engineering by building.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
