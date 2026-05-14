import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRIMINAL — Investigação Multiplayer",
  description: "Confie em ninguém. Descubra o assassino.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-[#F3F4F6]">
        {children}
      </body>
    </html>
  );
}
