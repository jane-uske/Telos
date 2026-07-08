"use client";

import { useEffect, useState } from "react";

const A4_HEIGHT = 1123;

export function usePageOverflow() {
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    let observer: ResizeObserver | null = null;

    function attach() {
      const el = document.getElementById("resume-sheet");
      if (!el) return;
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setSheetHeight(entry.target.scrollHeight);
        }
      });
      observer.observe(el);
    }

    attach();

    const mo = new MutationObserver(() => {
      if (observer) observer.disconnect();
      attach();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mo.disconnect();
    };
  }, []);

  return {
    overflowing: sheetHeight > A4_HEIGHT,
    pageCount: sheetHeight > 0 ? Math.ceil(sheetHeight / A4_HEIGHT) : 1,
    sheetHeight,
  };
}
