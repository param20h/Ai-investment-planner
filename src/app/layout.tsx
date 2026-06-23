import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vesta AI | Investment Research Agent",
  description: "Institutional-grade Invest, Watch, or Pass investment analysis in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
