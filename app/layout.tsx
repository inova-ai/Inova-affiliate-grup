import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inova Affiliate Grup — AI Affiliate Video Studio",
  description: "Ubah satu foto produk menjadi konsep video affiliate dengan AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
