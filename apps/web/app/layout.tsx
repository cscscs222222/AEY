import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Zeka AI",
  description: "Premium flört ve sosyal zekâ analiz asistanı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
