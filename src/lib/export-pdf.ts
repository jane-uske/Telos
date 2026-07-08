"use client";

import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";

/**
 * 把 #resume-sheet DOM 导出为 A4 PDF 文件下载。
 * 用 html2canvas-pro 截图(支持 oklch)+ jsPDF 拼页。
 */
export async function exportResumePDF(resume: Resume) {
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  const el = document.getElementById("resume-sheet");
  if (!el) {
    alert("找不到简历内容,请确保预览已渲染。");
    return;
  }

  // 临时去掉阴影/圆角,截出干净的图
  const prevShadow = el.style.boxShadow;
  const prevRadius = el.style.borderRadius;
  el.style.boxShadow = "none";
  el.style.borderRadius = "0";

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    // A4 尺寸(mm)
    const pdfWidth = 210;
    const pdfHeight = 297;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // 按图片宽高比计算在 A4 上的实际高度
    const imgRatio = canvas.height / canvas.width;
    const renderWidth = pdfWidth;
    const renderHeight = renderWidth * imgRatio;

    if (renderHeight <= pdfHeight) {
      // 单页
      pdf.addImage(imgData, "PNG", 0, 0, renderWidth, renderHeight);
    } else {
      // 多页:按 A4 高度切片
      let remaining = renderHeight;
      let position = 0;
      const pageCanvasHeight = (canvas.width * pdfHeight) / pdfWidth;

      while (remaining > 0) {
        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          renderWidth,
          renderHeight,
        );
        remaining -= pdfHeight;
        if (remaining > 0) {
          position -= pdfHeight;
          pdf.addPage();
        }
      }
    }

    const name = resume.basics.name?.trim() || "我的简历";
    pdf.save(`${name}-Telos简历.pdf`);
  } finally {
    el.style.boxShadow = prevShadow;
    el.style.borderRadius = prevRadius;
  }
}
