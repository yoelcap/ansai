export type Plan = "starter" | "pro" | "business";

export interface FakeUser {
  id: string;
  email: string;
  businessName: string;
  plan: Plan;
}

export interface Review {
  id: string;
  authorName: string;
  authorInitial: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  language: "es" | "en" | "nl";
  createdAt: string; // ISO 8601
  relativeTime: string;
  status: "pending" | "responded" | "ignored";
  source: "google";
}

export interface Metric {
  value: number | string;
  change: string;
  trend: "positive" | "negative" | "neutral";
  changeContext: string;
}

export interface DashboardMetrics {
  avgRating: Metric;
  totalReviews: Metric;
  pendingCount: Metric;
  avgResponseTime: Metric;
}

export interface ChartDataPoint {
  date: string;
  rating: number;
}

export interface SmartAlert {
  id: string;
  type: "info" | "warning" | "success";
  message: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  pendingReviews: Review[];
  chartData: ChartDataPoint[];
  alerts: SmartAlert[];
}

export function getMockDashboardData(): DashboardData {
  return {
    metrics: {
      avgRating: {
        value: 4.6,
        change: "+0.2",
        trend: "positive",
        changeContext: "este mes",
      },
      totalReviews: {
        value: 127,
        change: "+12",
        trend: "positive",
        changeContext: "esta semana",
      },
      pendingCount: {
        value: 8,
        change: "2 urgentes",
        trend: "neutral",
        changeContext: "",
      },
      avgResponseTime: {
        value: "2.3h",
        change: "Antes: 18h",
        trend: "positive",
        changeContext: "",
      },
    },
    pendingReviews: [
      {
        id: "r1",
        authorName: "María García",
        authorInitial: "M",
        rating: 2,
        text: "Esperamos casi una hora para que nos atendieran. La comida estaba bien pero el servicio fue muy lento y no pidieron disculpas.",
        language: "es",
        createdAt: "2026-05-07T08:30:00Z",
        relativeTime: "hace 2h",
        status: "pending",
        source: "google",
      },
      {
        id: "r2",
        authorName: "Jan Vermeer",
        authorInitial: "J",
        rating: 5,
        text: "Uitstekend restaurant! Het eten was heerlijk en de bediening was attent en vriendelijk. Zeker een aanrader voor iedereen.",
        language: "nl",
        createdAt: "2026-05-07T06:15:00Z",
        relativeTime: "hace 4h",
        status: "pending",
        source: "google",
      },
      {
        id: "r3",
        authorName: "Sophie Martin",
        authorInitial: "S",
        rating: 4,
        text: "Great food and cozy atmosphere. The pasta was excellent. Service could be a bit faster during busy hours but overall very happy.",
        language: "en",
        createdAt: "2026-05-06T19:45:00Z",
        relativeTime: "hace 13h",
        status: "pending",
        source: "google",
      },
      {
        id: "r4",
        authorName: "Carlos Ruiz",
        authorInitial: "C",
        rating: 1,
        text: "Pésima experiencia. Encontramos un pelo en la comida y cuando avisamos al camarero no se disculpó ni ofreció solución alguna.",
        language: "es",
        createdAt: "2026-05-06T14:20:00Z",
        relativeTime: "hace 18h",
        status: "pending",
        source: "google",
      },
      {
        id: "r5",
        authorName: "Emma De Vries",
        authorInitial: "E",
        rating: 4,
        text: "Leuk restaurant in het centrum. De portie was groot en de prijs was redelijk. We zullen zeker terugkomen.",
        language: "nl",
        createdAt: "2026-05-06T12:00:00Z",
        relativeTime: "hace 20h",
        status: "pending",
        source: "google",
      },
    ],
    chartData: generateChartData(),
    alerts: [
      {
        id: "a1",
        type: "warning",
        message: '3 reseñas mencionan "tiempo de espera" esta semana',
      },
      {
        id: "a2",
        type: "success",
        message: "Tu rating subió 0.2 puntos vs el mes pasado",
      },
      {
        id: "a3",
        type: "warning",
        message: "Nueva reseña de 1 estrella requiere atención urgente",
      },
    ],
  };
}

function generateChartData(): ChartDataPoint[] {
  // Deterministic 30-day data (Apr 7 – May 6, 2026) with upward trend
  const ratings = [
    4.2, 4.1, 4.3, 4.2, 4.4, 4.3, 4.5, 4.4, 4.3, 4.5,
    4.4, 4.6, 4.5, 4.4, 4.6, 4.5, 4.7, 4.6, 4.5, 4.6,
    4.7, 4.6, 4.8, 4.7, 4.6, 4.7, 4.8, 4.6, 4.7, 4.6,
  ];
  const labels = [
    "7 Abr", "8 Abr", "9 Abr", "10 Abr", "11 Abr", "12 Abr", "13 Abr",
    "14 Abr", "15 Abr", "16 Abr", "17 Abr", "18 Abr", "19 Abr", "20 Abr",
    "21 Abr", "22 Abr", "23 Abr", "24 Abr", "25 Abr", "26 Abr", "27 Abr",
    "28 Abr", "29 Abr", "30 Abr", "1 May", "2 May", "3 May", "4 May",
    "5 May", "6 May",
  ];
  return labels.map((date, i) => ({ date, rating: ratings[i] }));
}
