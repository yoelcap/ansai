import type { Metric } from "./dashboardData";

export type Period = "7d" | "30d" | "90d" | "year";

export interface InsightKPIs {
  avgRating: Metric;
  reviewsReceived: Metric;
  responseRate: Metric;
  avgResponseTime: Metric;
}

export interface RatingPoint {
  date: string;
  rating: number;
}

export interface StarBucket {
  label: string;
  count: number;
  color: string;
}

export interface LanguageBucket {
  code: string;
  label: string;
  count: number;
  color: string;
}

export interface Topic {
  name: string;
  count: number;
  positivePercent: number;
}

export interface CriticalIssue {
  id: string;
  topic: string;
  mentions: number;
  severity: "high" | "medium" | "low";
  example: string;
}

export interface InsightsData {
  kpis: InsightKPIs;
  ratingEvolution: RatingPoint[];
  starDistribution: StarBucket[];
  languageShare: LanguageBucket[];
  topics: Topic[];
  criticalIssues: CriticalIssue[];
}

// ─── Palette constants (hex values from tailwind.config.ts) ───────────────────
const C = {
  forest: "#1f3a2e",
  forestLight: "#2d5544",
  terra: "#c4663d",
  terraLight: "#d97e54",
  gold: "#c9a961",
  muted: "#6b6660",
} as const;

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis: Record<Period, InsightKPIs> = {
  "7d": {
    avgRating: { value: 4.5, change: "+0.1", trend: "positive", changeContext: "" },
    reviewsReceived: { value: 12, change: "+3", trend: "positive", changeContext: "" },
    responseRate: { value: "83%", change: "+5%", trend: "positive", changeContext: "" },
    avgResponseTime: { value: "1.8h", change: "−2.2h", trend: "positive", changeContext: "" },
  },
  "30d": {
    avgRating: { value: 4.6, change: "+0.2", trend: "positive", changeContext: "" },
    reviewsReceived: { value: 47, change: "+12", trend: "positive", changeContext: "" },
    responseRate: { value: "92%", change: "+8%", trend: "positive", changeContext: "" },
    avgResponseTime: { value: "2.3h", change: "−15.7h", trend: "positive", changeContext: "" },
  },
  "90d": {
    avgRating: { value: 4.4, change: "+0.3", trend: "positive", changeContext: "" },
    reviewsReceived: { value: 142, change: "+28", trend: "positive", changeContext: "" },
    responseRate: { value: "88%", change: "+15%", trend: "positive", changeContext: "" },
    avgResponseTime: { value: "3.1h", change: "−18.9h", trend: "positive", changeContext: "" },
  },
  year: {
    avgRating: { value: 4.3, change: "+0.4", trend: "positive", changeContext: "" },
    reviewsReceived: { value: 527, change: "+84", trend: "positive", changeContext: "" },
    responseRate: { value: "79%", change: "+22%", trend: "positive", changeContext: "" },
    avgResponseTime: { value: "4.2h", change: "−27.8h", trend: "positive", changeContext: "" },
  },
};

// ─── Rating evolution ─────────────────────────────────────────────────────────
const evolution7d: RatingPoint[] = [
  { date: "3 May", rating: 4.2 }, { date: "4 May", rating: 4.5 },
  { date: "5 May", rating: 4.4 }, { date: "6 May", rating: 4.6 },
  { date: "7 May", rating: 4.5 }, { date: "8 May", rating: 4.7 },
  { date: "9 May", rating: 4.5 },
];

const evolution30d: RatingPoint[] = [
  { date: "10 Abr", rating: 4.2 }, { date: "11 Abr", rating: 4.3 },
  { date: "12 Abr", rating: 4.1 }, { date: "13 Abr", rating: 4.4 },
  { date: "14 Abr", rating: 4.3 }, { date: "15 Abr", rating: 4.5 },
  { date: "16 Abr", rating: 4.4 }, { date: "17 Abr", rating: 4.3 },
  { date: "18 Abr", rating: 4.5 }, { date: "19 Abr", rating: 4.6 },
  { date: "20 Abr", rating: 4.4 }, { date: "21 Abr", rating: 4.6 },
  { date: "22 Abr", rating: 4.5 }, { date: "23 Abr", rating: 4.7 },
  { date: "24 Abr", rating: 4.5 }, { date: "25 Abr", rating: 4.6 },
  { date: "26 Abr", rating: 4.7 }, { date: "27 Abr", rating: 4.5 },
  { date: "28 Abr", rating: 4.8 }, { date: "29 Abr", rating: 4.6 },
  { date: "30 Abr", rating: 4.7 }, { date: "1 May", rating: 4.5 },
  { date: "2 May", rating: 4.6 }, { date: "3 May", rating: 4.8 },
  { date: "4 May", rating: 4.5 }, { date: "5 May", rating: 4.7 },
  { date: "6 May", rating: 4.6 }, { date: "7 May", rating: 4.5 },
  { date: "8 May", rating: 4.7 }, { date: "9 May", rating: 4.6 },
];

const evolution90d: RatingPoint[] = [
  { date: "S1 Feb", rating: 4.0 }, { date: "S2 Feb", rating: 4.1 },
  { date: "S3 Feb", rating: 4.2 }, { date: "S4 Feb", rating: 4.0 },
  { date: "S1 Mar", rating: 4.2 }, { date: "S2 Mar", rating: 4.3 },
  { date: "S3 Mar", rating: 4.1 }, { date: "S4 Mar", rating: 4.4 },
  { date: "S1 Abr", rating: 4.3 }, { date: "S2 Abr", rating: 4.5 },
  { date: "S3 Abr", rating: 4.4 }, { date: "S4 Abr", rating: 4.6 },
  { date: "S1 May", rating: 4.5 },
];

const evolutionYear: RatingPoint[] = [
  { date: "Jun 25", rating: 3.9 }, { date: "Jul 25", rating: 4.0 },
  { date: "Ago 25", rating: 3.8 }, { date: "Sep 25", rating: 4.1 },
  { date: "Oct 25", rating: 4.0 }, { date: "Nov 25", rating: 4.2 },
  { date: "Dic 25", rating: 4.1 }, { date: "Ene 26", rating: 4.2 },
  { date: "Feb 26", rating: 4.1 }, { date: "Mar 26", rating: 4.3 },
  { date: "Abr 26", rating: 4.5 }, { date: "May 26", rating: 4.6 },
];

const evolutionByPeriod: Record<Period, RatingPoint[]> = {
  "7d": evolution7d,
  "30d": evolution30d,
  "90d": evolution90d,
  year: evolutionYear,
};

// ─── Star distribution ────────────────────────────────────────────────────────
const starColors: Record<number, string> = {
  5: C.forest,
  4: C.forestLight,
  3: C.gold,
  2: C.terraLight,
  1: C.terra,
};

function makeStars(counts: number[]): StarBucket[] {
  return [5, 4, 3, 2, 1].map((s, i) => ({
    label: `${s} ★`,
    count: counts[i],
    color: starColors[s],
  }));
}

const starsByPeriod: Record<Period, StarBucket[]> = {
  "7d": makeStars([5, 4, 1, 1, 1]),
  "30d": makeStars([18, 14, 8, 4, 3]),
  "90d": makeStars([55, 43, 26, 11, 7]),
  year: makeStars([204, 162, 92, 42, 27]),
};

// ─── Language share ───────────────────────────────────────────────────────────
const langColors = [C.forest, C.forestLight, C.terra, C.gold];

function makeLangs(counts: number[]): LanguageBucket[] {
  const labels = ["NL", "FR", "ES", "EN"];
  return labels.map((code, i) => ({
    code,
    label: code,
    count: counts[i],
    color: langColors[i],
  }));
}

const langsByPeriod: Record<Period, LanguageBucket[]> = {
  "7d": makeLangs([5, 3, 2, 2]),
  "30d": makeLangs([20, 13, 8, 6]),
  "90d": makeLangs([60, 40, 25, 17]),
  year: makeLangs([222, 147, 95, 63]),
};

// ─── Topics (scale counts by period) ─────────────────────────────────────────
function scaleTopics(factor: number): Topic[] {
  return [
    { name: "Comida", count: Math.round(28 * factor), positivePercent: 82 },
    { name: "Servicio", count: Math.round(24 * factor), positivePercent: 58 },
    { name: "Ambiente", count: Math.round(19 * factor), positivePercent: 74 },
    { name: "Precio", count: Math.round(16 * factor), positivePercent: 69 },
    { name: "Tiempo de espera", count: Math.round(14 * factor), positivePercent: 29 },
    { name: "Limpieza", count: Math.round(11 * factor), positivePercent: 73 },
    { name: "Ubicación", count: Math.round(9 * factor), positivePercent: 89 },
    { name: "Personal", count: Math.round(8 * factor), positivePercent: 63 },
  ];
}

const topicsByPeriod: Record<Period, Topic[]> = {
  "7d": scaleTopics(0.25),
  "30d": scaleTopics(1),
  "90d": scaleTopics(3),
  year: scaleTopics(11),
};

// ─── Critical issues ──────────────────────────────────────────────────────────
const criticalIssues: CriticalIssue[] = [
  {
    id: "c1",
    topic: "Tiempo de espera excesivo",
    mentions: 5,
    severity: "high",
    example: "«Esperamos más de una hora sin que nadie nos explicara el retraso»",
  },
  {
    id: "c2",
    topic: "Atención del personal",
    mentions: 3,
    severity: "medium",
    example: "«El camarero no pidió disculpas ni ofreció ninguna solución»",
  },
  {
    id: "c3",
    topic: "Calidad-precio",
    mentions: 3,
    severity: "medium",
    example: "«Para el precio que cobran, esperaba algo más elaborado»",
  },
  {
    id: "c4",
    topic: "Limpieza del local",
    mentions: 2,
    severity: "low",
    example: "«Los baños no estaban en las mejores condiciones»",
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────
export function getMockInsightsData(period: Period): InsightsData {
  return {
    kpis: kpis[period],
    ratingEvolution: evolutionByPeriod[period],
    starDistribution: starsByPeriod[period],
    languageShare: langsByPeriod[period],
    topics: topicsByPeriod[period],
    criticalIssues,
  };
}

export function getRatingDomain(period: Period): [number, number] {
  return period === "year" ? [3.5, 5] : [3.8, 5];
}
