/** AI 分析结果类型定义 */

export interface DimensionScore {
  name: string;
  score: number;
  advice: string;
}

export interface GeneralAnalysisResult {
  type: "general";
  overall: number;
  dimensions: DimensionScore[];
  highlights: string[];
  improvements: string[];
}

export interface JdKeyword {
  term: string;
  hit: boolean;
  context: string;
}

export interface JdMatchAnalysisResult {
  type: "jd";
  matchScore: number;
  keywords: JdKeyword[];
  missing: string[];
  suggestions: string[];
}

export type AnalysisResult = GeneralAnalysisResult | JdMatchAnalysisResult;
