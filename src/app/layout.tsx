import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Telos 简历 · 专业简历,智能生成",
  description:
    "100+ 专业模板覆盖全行业,AI 帮你润色每段经历、命中职位关键词。ATS 友好,一键导出 PDF。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${jakarta.variable} ${sourceSerif.variable} antialiased`}
    >
      <head>
        {/* CJK 字体走 CDN,避免 next/font 自托管数 MB 的 Noto Sans SC */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;600&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-ink">
        {children}
      </body>
    </html>
  );
}
