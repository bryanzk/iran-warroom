import "@/app/globals.css";
import type { ReactNode } from "react";
import { JetBrains_Mono, Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"]
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700"]
});

export const metadata = {
  title: "Iran Airstrike Situation Overview / 伊朗境内空袭事件信息概览",
  description: "Neutral, traceable incident overview with explicit verification labels. / 中立、可追溯、含核验标注的信息可视化页面"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable}`}>{children}</body>
    </html>
  );
}
