"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ResumePreview } from "@/components/resume-preview";
import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";

interface ExportPayload {
  resume: Resume;
  theme: ResumeTheme;
  sectionOrder: SectionKey[];
}

/**
 * 仅供服务端导出使用的打印页：无头浏览器带 ?token 打开，取回暂存数据后渲染
 * 与编辑器一致的 ResumePreview，配 A4 打印样式，再由 page.pdf 截成文字版 PDF。
 */
export default function PrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintInner />
    </Suspense>
  );
}

function PrintInner() {
  const token = useSearchParams().get("token");
  const [payload, setPayload] = useState<ExportPayload | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/export?token=${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ExportPayload | null) => d && setPayload(d))
      .catch(() => {});
  }, [token]);

  if (!payload) return null;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #fff; }
        /* A4 无边距，简历自身控制内边距；#resume-sheet 去掉屏幕态的阴影/圆角 */
        @page { size: A4; margin: 0; }
        #resume-sheet { box-shadow: none !important; border-radius: 0 !important; }
        #print-root { width: 794px; margin: 0 auto; background: #fff; }
      `}</style>
      <div id="print-root">
        <ResumePreview
          resume={payload.resume}
          theme={payload.theme}
          sectionOrder={payload.sectionOrder}
        />
      </div>
    </>
  );
}
