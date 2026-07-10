/**
 * 模板配置系统 —— 每个模板是一份配置(布局 + 强调色 + 分类标签),
 * 新增模板只需在此追加一条;目标是 100+。
 */

export type TemplateLayout =
  | "classic"
  | "sidebar"
  | "banner"
  | "serif"
  | "minimal"
  | "timeline"
  | "photo"
  | "two-col"
  | "dark"
  | "metro"
  | "elegant"
  | "compact"
  | "right-rail"
  | "statement";

export interface Template {
  id: string;
  /** 中文名 */
  name: string;
  /** 英文名 */
  en: string;
  /** 一句话描述(栏数 / 风格) */
  desc: string;
  /** 主分类,用于卡片右上角标签 */
  category: string;
  /** 筛选标签(行业 + 栏数) */
  tags: string[];
  /** 缩略图布局骨架 */
  layout: TemplateLayout;
  /** 强调色(oklch) */
  accent: string;
  /** 标签浅底色 */
  accentSoft: string;
  popular?: boolean;
}

/** 筛选项:行业 + 栏数 */
export const filters = [
  "全部",
  "互联网",
  "金融",
  "校招",
  "留学",
  "创意",
  "学术",
  "单栏",
  "双栏",
];

const BRAND = "oklch(0.56 0.195 255)";
const BRAND_SOFT = "oklch(0.96 0.028 255)";

export const templates: Template[] = [
  {
    id: "classic",
    name: "经典专业",
    en: "Classic Pro",
    desc: "单栏 · 通用",
    category: "热门",
    tags: ["互联网", "单栏"],
    layout: "classic",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
    popular: true,
  },
  {
    id: "sidebar",
    name: "商务侧栏",
    en: "Sidebar",
    desc: "双栏 · 商务",
    category: "金融",
    tags: ["金融", "双栏"],
    layout: "sidebar",
    accent: "oklch(0.44 0.19 257)",
    accentSoft: "oklch(0.95 0.04 270)",
  },
  {
    id: "banner",
    name: "顶部色块",
    en: "Banner",
    desc: "顶部色块 · 市场",
    category: "创意",
    tags: ["创意", "双栏"],
    layout: "banner",
    accent: "oklch(0.62 0.16 45)",
    accentSoft: "oklch(0.95 0.05 45)",
  },
  {
    id: "serif",
    name: "学院衬线",
    en: "Center Serif",
    desc: "居中 · 学术",
    category: "留学",
    tags: ["留学", "学术", "单栏"],
    layout: "serif",
    accent: "oklch(0.52 0.14 305)",
    accentSoft: "oklch(0.95 0.03 305)",
  },
  {
    id: "minimal",
    name: "极简留白",
    en: "Minimal",
    desc: "单栏 · 极简",
    category: "设计",
    tags: ["创意", "单栏"],
    layout: "minimal",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
  },
  {
    id: "timeline",
    name: "时间轴",
    en: "Timeline",
    desc: "单栏 · 技术",
    category: "互联网",
    tags: ["互联网", "单栏"],
    layout: "timeline",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
    popular: true,
  },
  {
    id: "photo",
    name: "证件照",
    en: "Photo",
    desc: "双栏 · 校园",
    category: "校招",
    tags: ["校招", "双栏"],
    layout: "photo",
    accent: "oklch(0.58 0.13 150)",
    accentSoft: "oklch(0.95 0.04 150)",
  },
  {
    id: "two-col",
    name: "现代双栏",
    en: "Modern Two",
    desc: "双栏 · 现代",
    category: "通用",
    tags: ["互联网", "双栏"],
    layout: "two-col",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
  },
  {
    id: "dark",
    name: "深色高管",
    en: "Dark Pro",
    desc: "单栏 · 稳重",
    category: "高管",
    tags: ["金融", "单栏"],
    layout: "dark",
    accent: "oklch(0.50 0.16 265)",
    accentSoft: "oklch(0.95 0.04 270)",
  },
  {
    id: "metro",
    name: "网格卡片",
    en: "Metro Cards",
    desc: "卡片网格 · 现代",
    category: "互联网",
    tags: ["互联网", "单栏"],
    layout: "metro",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
    popular: true,
  },
  {
    id: "metro-warm",
    name: "暖调卡片",
    en: "Metro Warm",
    desc: "卡片网格 · 创意",
    category: "创意",
    tags: ["创意", "单栏"],
    layout: "metro",
    accent: "oklch(0.62 0.16 45)",
    accentSoft: "oklch(0.95 0.05 45)",
  },
  {
    id: "metro-teal",
    name: "清新卡片",
    en: "Metro Teal",
    desc: "卡片网格 · 清新",
    category: "校招",
    tags: ["校招", "单栏"],
    layout: "metro",
    accent: "oklch(0.55 0.13 180)",
    accentSoft: "oklch(0.95 0.03 180)",
  },
  {
    id: "elegant",
    name: "优雅典线",
    en: "Elegant",
    desc: "居中 · 精致",
    category: "留学",
    tags: ["留学", "学术", "单栏"],
    layout: "elegant",
    accent: "oklch(0.52 0.14 305)",
    accentSoft: "oklch(0.95 0.03 305)",
  },
  {
    id: "elegant-rose",
    name: "玫瑰典雅",
    en: "Rose Elegant",
    desc: "居中 · 柔美",
    category: "创意",
    tags: ["创意", "单栏"],
    layout: "elegant",
    accent: "oklch(0.58 0.14 350)",
    accentSoft: "oklch(0.95 0.03 350)",
  },
  {
    id: "compact",
    name: "信息密集",
    en: "Compact",
    desc: "双栏 · 紧凑",
    category: "互联网",
    tags: ["互联网", "双栏"],
    layout: "compact",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
  },
  {
    id: "compact-dark",
    name: "干练紧凑",
    en: "Compact Dark",
    desc: "双栏 · 稳重",
    category: "金融",
    tags: ["金融", "双栏"],
    layout: "compact",
    accent: "oklch(0.35 0.05 250)",
    accentSoft: "oklch(0.95 0.01 250)",
  },
  {
    id: "right-rail",
    name: "右栏简约",
    en: "Right Rail",
    desc: "双栏 · 右侧栏",
    category: "互联网",
    tags: ["互联网", "双栏"],
    layout: "right-rail",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
    popular: true,
  },
  {
    id: "right-rail-green",
    name: "右栏清新",
    en: "Rail Green",
    desc: "双栏 · 清新",
    category: "校招",
    tags: ["校招", "双栏"],
    layout: "right-rail",
    accent: "oklch(0.58 0.13 150)",
    accentSoft: "oklch(0.95 0.04 150)",
  },
  {
    id: "statement",
    name: "大字标题",
    en: "Statement",
    desc: "单栏 · 设计感",
    category: "创意",
    tags: ["创意", "单栏"],
    layout: "statement",
    accent: "oklch(0.20 0.012 250)",
    accentSoft: "oklch(0.95 0.01 250)",
  },
  {
    id: "statement-blue",
    name: "大字醒目",
    en: "Bold Blue",
    desc: "单栏 · 现代",
    category: "互联网",
    tags: ["互联网", "单栏"],
    layout: "statement",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
  },
  {
    id: "serif-navy",
    name: "深蓝学院",
    en: "Navy Serif",
    desc: "居中 · 正式",
    category: "留学",
    tags: ["留学", "学术", "单栏"],
    layout: "serif",
    accent: "oklch(0.44 0.19 257)",
    accentSoft: "oklch(0.95 0.04 270)",
  },
  {
    id: "timeline-green",
    name: "绿意时间轴",
    en: "Green Line",
    desc: "单栏 · 清新",
    category: "互联网",
    tags: ["互联网", "校招", "单栏"],
    layout: "timeline",
    accent: "oklch(0.58 0.13 150)",
    accentSoft: "oklch(0.95 0.04 150)",
  },
  {
    id: "banner-ink",
    name: "墨色横幅",
    en: "Ink Banner",
    desc: "顶部色块 · 稳重",
    category: "金融",
    tags: ["金融", "双栏"],
    layout: "banner",
    accent: "oklch(0.20 0.012 250)",
    accentSoft: "oklch(0.95 0.01 250)",
  },
  {
    id: "two-col-purple",
    name: "紫韵双栏",
    en: "Violet Two",
    desc: "双栏 · 学术",
    category: "留学",
    tags: ["留学", "双栏"],
    layout: "two-col",
    accent: "oklch(0.52 0.14 305)",
    accentSoft: "oklch(0.95 0.03 305)",
  },
  {
    id: "photo-blue",
    name: "校园蓝照",
    en: "Campus Photo",
    desc: "证件照 · 校招",
    category: "校招",
    tags: ["校招", "双栏"],
    layout: "photo",
    accent: BRAND,
    accentSoft: BRAND_SOFT,
  },
  {
    id: "sidebar-slate",
    name: "石板侧栏",
    en: "Slate Side",
    desc: "双栏 · 沉稳",
    category: "金融",
    tags: ["金融", "互联网", "双栏"],
    layout: "sidebar",
    accent: "oklch(0.35 0.05 250)",
    accentSoft: "oklch(0.95 0.01 250)",
  },
];
