// Telos TemplateSpec system (ported): TemplateSpec + 14 presets + render helpers.
// A "template" is a constrained set of JSON design params — no code flows through,
// so A4 / ATS output stays safe. Colors accept only #hex / oklch().

import type { TemplateSpec, TplPreset } from "./types";

const B = "#5850ec";

export const defaultSpec = (): TemplateSpec => ({
  specVersion: 1,
  skeleton: "single",
  sidebarRatio: 34,
  header: { align: "left", style: "underline", nameScale: "lg" },
  section: { titleStyle: "caps", titleLang: "zh", density: "normal" },
  typography: { font: "sans" },
  colors: { accent: B, headerBg: "", sidebarBg: "" },
});

export const tplPresets = (): TplPreset[] => [
  { id: "classic", name: "经典专业", en: "Classic Pro", desc: "单栏 · 通用", accent: B, spec: { skeleton: "single", header: { align: "left", style: "underline", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "" } } },
  { id: "sidebar", name: "商务侧栏", en: "Sidebar", desc: "双栏 · 商务", accent: "#2f4bcf", spec: { skeleton: "sidebar-left", sidebarRatio: 34, header: { align: "left", style: "plain", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: "#2f4bcf", headerBg: "", sidebarBg: "#f4f5fb" } } },
  { id: "banner", name: "顶部色块", en: "Banner", desc: "顶部色块 · 市场", accent: "#c8622a", spec: { skeleton: "banner", header: { align: "left", style: "band", nameScale: "lg" }, section: { titleStyle: "leftbar", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: "#c8622a", headerBg: "#c8622a", sidebarBg: "" } } },
  { id: "serif", name: "学院衬线", en: "Center Serif", desc: "居中 · 学术", accent: "#7a3f9d", spec: { skeleton: "single", header: { align: "center", style: "underline", nameScale: "xl" }, section: { titleStyle: "underline", titleLang: "en", density: "normal" }, typography: { font: "serif" }, colors: { accent: "#7a3f9d", headerBg: "", sidebarBg: "" } } },
  { id: "minimal", name: "极简留白", en: "Minimal", desc: "单栏 · 极简", accent: B, spec: { skeleton: "single", header: { align: "left", style: "plain", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "en", density: "loose" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "" } } },
  { id: "timeline", name: "时间轴", en: "Timeline", desc: "单栏 · 技术", accent: B, spec: { skeleton: "single", header: { align: "left", style: "underline", nameScale: "lg" }, section: { titleStyle: "leftbar", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "" } } },
  { id: "two-col", name: "现代双栏", en: "Modern Two", desc: "双栏 · 现代", accent: B, spec: { skeleton: "sidebar-left", sidebarRatio: 32, header: { align: "left", style: "underline", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "#f4f5fb" } } },
  { id: "dark", name: "深色高管", en: "Dark Pro", desc: "单栏 · 稳重", accent: "#3b4a6b", spec: { skeleton: "banner", header: { align: "left", style: "band", nameScale: "xl" }, section: { titleStyle: "caps", titleLang: "en", density: "normal" }, typography: { font: "sans" }, colors: { accent: "#3b4a6b", headerBg: "#1f2740", sidebarBg: "" } } },
  { id: "elegant", name: "优雅典线", en: "Elegant", desc: "居中 · 精致", accent: "#7a3f9d", spec: { skeleton: "single", header: { align: "center", style: "plain", nameScale: "xl" }, section: { titleStyle: "band", titleLang: "en", density: "loose" }, typography: { font: "serif" }, colors: { accent: "#7a3f9d", headerBg: "", sidebarBg: "" } } },
  { id: "compact", name: "信息密集", en: "Compact", desc: "双栏 · 紧凑", accent: B, spec: { skeleton: "sidebar-left", sidebarRatio: 30, header: { align: "left", style: "plain", nameScale: "md" }, section: { titleStyle: "caps", titleLang: "zh", density: "compact" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "#f4f5fb" } } },
  { id: "right-rail", name: "右栏简约", en: "Right Rail", desc: "双栏 · 右侧栏", accent: B, spec: { skeleton: "sidebar-right", sidebarRatio: 32, header: { align: "left", style: "underline", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: B, headerBg: "", sidebarBg: "#f4f5fb" } } },
  { id: "right-rail-green", name: "右栏清新", en: "Rail Green", desc: "双栏 · 清新", accent: "#3f8f5e", spec: { skeleton: "sidebar-right", sidebarRatio: 32, header: { align: "left", style: "underline", nameScale: "lg" }, section: { titleStyle: "leftbar", titleLang: "zh", density: "normal" }, typography: { font: "sans" }, colors: { accent: "#3f8f5e", headerBg: "", sidebarBg: "#eef7f1" } } },
  { id: "statement", name: "大字标题", en: "Statement", desc: "单栏 · 设计感", accent: "#1f2740", spec: { skeleton: "single", header: { align: "left", style: "plain", nameScale: "xl" }, section: { titleStyle: "underline", titleLang: "en", density: "loose" }, typography: { font: "sans" }, colors: { accent: "#1f2740", headerBg: "", sidebarBg: "" } } },
  { id: "slate", name: "石板侧栏", en: "Slate Side", desc: "双栏 · 沉稳", accent: "#3b4a6b", spec: { skeleton: "sidebar-left", sidebarRatio: 34, header: { align: "left", style: "plain", nameScale: "lg" }, section: { titleStyle: "caps", titleLang: "en", density: "normal" }, typography: { font: "sans" }, colors: { accent: "#3b4a6b", headerBg: "", sidebarBg: "#2b3450" } } },
];

// Pure resolver for the current spec — used in render (must not allocate inside
// a zustand selector, which would loop). resumeSpec wins; else derive from preset.
export const computeSpec = (resumeSpec: TemplateSpec | null, resumeTpl: string): TemplateSpec => {
  if (resumeSpec) return resumeSpec;
  const preset = tplPresets().find((p) => p.id === resumeTpl) || tplPresets()[0];
  return { specVersion: 1, sidebarRatio: 34, ...preset.spec } as TemplateSpec;
};

export const fontFam = (f: TemplateSpec["typography"]["font"]) =>
  f === "serif"
    ? "'Noto Serif SC', serif"
    : f === "mono"
    ? "'JetBrains Mono', monospace"
    : "'Noto Sans SC', sans-serif";

export const densityCfg = (d: TemplateSpec["section"]["density"]) =>
  d === "compact"
    ? { gap: 9, pad: "22px 26px", line: 1.5, body: 11.5 }
    : d === "loose"
    ? { gap: 18, pad: "38px 42px", line: 1.75, body: 12.5 }
    : { gap: 13, pad: "30px 34px", line: 1.62, body: 12 };

export const nameSize = (n: TemplateSpec["header"]["nameScale"]) =>
  n === "md" ? 21 : n === "xl" ? 34 : 26;

export const contactList = (): string[] => [
  "杭州",
  "5 年经验",
  "lin.shen@demo.dev",
  "github.com/linshen",
];
