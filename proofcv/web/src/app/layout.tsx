import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telos · 从旧简历到面试准备，一次完成",
  description:
    "导入旧简历，AI 帮你找回遗漏的项目细节，针对目标岗位生成专属简历、面试 QA 和模拟面试。每参加一次面试，下一次准备都会更充分。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
