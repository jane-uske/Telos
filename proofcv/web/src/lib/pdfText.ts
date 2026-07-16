"use client";

// 浏览器本地 PDF 文本抽取（pdfjs-dist）。文件不上传任何服务器——
// 解析全程发生在用户设备内存里。只支持带文本层的 PDF；扫描版（纯图片）
// 抽不出文字，调用方需要明确提示用户。

export interface PdfTextResult {
  ok: boolean;
  text: string;
  pages: number;
  /** 无文本层（疑似扫描版）时为 true */
  scanned: boolean;
  error?: string;
}

export async function extractPdfText(file: File): Promise<PdfTextResult> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const parts: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let line = "";
      let lastY: number | null = null;
      const pageLines: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = (item.transform as number[])[5];
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          if (line.trim()) pageLines.push(line.trim());
          line = "";
        }
        line += item.str + (item.hasEOL ? "\n" : " ");
        lastY = y;
      }
      if (line.trim()) pageLines.push(line.trim());
      parts.push(pageLines.join("\n"));
      page.cleanup();
    }
    const text = parts.join("\n\n").replace(/[ \t]+\n/g, "\n").trim();
    await doc.cleanup().catch(() => {});
    return { ok: true, text, pages: parts.length, scanned: text.replace(/\s/g, "").length < 30 };
  } catch (e) {
    return {
      ok: false,
      text: "",
      pages: 0,
      scanned: false,
      error: e instanceof Error ? e.message : "PDF 解析失败",
    };
  }
}
