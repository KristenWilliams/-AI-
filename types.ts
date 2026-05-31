export enum Language {
  ZH = 'zh',
  EN = 'en'
}

export enum RiskLevel {
  SAFE = 'SAFE',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  UNKNOWN = 'UNKNOWN'
}

export interface Additive {
  name: string;
  code?: string; // E-number or INS
  function: string;
  riskLevel: RiskLevel;
  description: string;
}

export interface StandardsAnalysis {
  gb_china: string;
  eu_standard: string;
  us_fda: string;
}

export interface FoodAnalysisResult {
  productName: string;
  ingredients: string[];
  additives: Additive[];
  allergens: string[];
  healthScore: number; // 0-100
  summary: string;
  standardsAnalysis: StandardsAnalysis;
  nutritionFacts?: {
    calories?: string;
    sugar?: string;
    fat?: string;
    sodium?: string;
  };
}

export interface Translation {
  title: string;
  uploadTitle: string;
  uploadDesc: string;
  takePhoto: string;
  uploadGallery: string;
  analyzing: string;
  analyzingDesc: string;
  score: string;
  ingredients: string;
  additives: string;
  allergens: string;
  standards: string;
  summary: string;
  reset: string;
  safe: string;
  moderate: string;
  high: string;
  gb: string;
  eu: string;
  us: string;
  unknown: string;
  nutrition: string;
}