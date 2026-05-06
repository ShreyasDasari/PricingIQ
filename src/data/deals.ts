export type Product = "Creo" | "Windchill" | "ThingWorx";
export type Segment = "Enterprise" | "Mid-Market" | "SMB" | "Partner";
export type Region = "Americas" | "EMEA" | "APAC";
export type RiskLevel = "High" | "Medium" | "Low";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type CorridorStatus = "green" | "yellow" | "red";

export interface Deal {
  id: string;
  product: Product;
  segment: Segment;
  region: Region;
  quarter: Quarter;
  listPrice: number;
  volumeDiscount: number;
  promoDiscount: number;
  partnerDiscount: number;
  netPrice: number;
  realizedRevenue: number;
  totalDiscountRate: number;
  daysInPipeline: number;
  closeRate: number;
  riskScore: number;
  riskLevel: RiskLevel;
  corridorStatus: CorridorStatus;
  rep: string;
  shapFactors: {
    discount: number;
    dealSize: number;
    pipeline: number;
    closeRate: number;
  };
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function range(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

const reps = [
  "Alex Chen", "Maria Santos", "James Okafor", "Priya Nair", "David Kim",
  "Sarah Hoffman", "Marcus Webb", "Aisha Patel", "Tom Larsson", "Nina Rossi",
  "Carlos Rivera", "Elena Volkov", "Ben Adeyemi", "Suki Tanaka", "Paul Mbeki",
];

const PRODUCTS: Product[] = ["Creo", "Windchill", "ThingWorx"];
const SEGMENTS: Segment[] = ["Enterprise", "Mid-Market", "SMB", "Partner"];
const REGIONS: Region[] = ["Americas", "EMEA", "APAC"];
const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

const LIST_PRICE_RANGE: Record<Product, [number, number]> = {
  Creo: [10000, 500000],
  Windchill: [50000, 2000000],
  ThingWorx: [25000, 1000000],
};

const BASE_VOLUME_DISCOUNT: Record<Segment, [number, number]> = {
  Enterprise: [0.05, 0.2],
  "Mid-Market": [0.03, 0.12],
  SMB: [0, 0.06],
  Partner: [0.08, 0.18],
};

function generateDeals(): Deal[] {
  const rng = mulberry32(42);
  const deals: Deal[] = [];

  for (let i = 0; i < 500; i++) {
    const product = pick<Product>(rng, PRODUCTS);
    const segment = pick<Segment>(rng, SEGMENTS);
    const region = pick<Region>(rng, REGIONS);
    const quarter = pick<Quarter>(rng, QUARTERS);
    const rep = pick<string>(rng, reps);

    const [lpMin, lpMax] = LIST_PRICE_RANGE[product];
    const listPrice = Math.round(range(rng, lpMin, lpMax) / 1000) * 1000;

    const [vdMin, vdMax] = BASE_VOLUME_DISCOUNT[segment];
    const volumeDiscount = range(rng, vdMin, vdMax);
    const promoDiscount = range(rng, 0, 0.12);
    const partnerDiscount = segment === "Partner" ? range(rng, 0.05, 0.15) : range(rng, 0, 0.08);

    const totalDiscountRate = Math.min(volumeDiscount + promoDiscount + partnerDiscount, 0.72);
    const netPrice = Math.round(listPrice * (1 - totalDiscountRate));

    const realizationNoise = range(rng, -0.03, 0.01);
    const realizedRevenue = Math.round(netPrice * (1 + realizationNoise));

    const daysInPipeline = Math.round(range(rng, 1, 180));
    const closeRate = Math.max(0.05, 1 - totalDiscountRate * 0.8 - daysInPipeline / 400);

    // Scoring (0-1, higher = more risk)
    const normalizedDiscount = totalDiscountRate / 0.72;
    const normalizedSize = (listPrice - lpMin) / (lpMax - lpMin);
    const normalizedPipeline = daysInPipeline / 180;
    const normalizedClose = 1 - closeRate;

    const riskScore =
      normalizedDiscount * 0.4 +
      normalizedSize * 0.2 +
      normalizedPipeline * 0.2 +
      normalizedClose * 0.2;

    const riskLevel: RiskLevel =
      riskScore > 0.6 ? "High" : riskScore > 0.35 ? "Medium" : "Low";

    const corridorStatus: CorridorStatus =
      totalDiscountRate <= 0.2 ? "green" : totalDiscountRate <= 0.35 ? "yellow" : "red";

    deals.push({
      id: `DEAL-${String(i + 1).padStart(4, "0")}`,
      product,
      segment,
      region,
      quarter,
      listPrice,
      volumeDiscount,
      promoDiscount,
      partnerDiscount,
      netPrice,
      realizedRevenue,
      totalDiscountRate,
      daysInPipeline,
      closeRate,
      riskScore,
      riskLevel,
      corridorStatus,
      rep,
      shapFactors: {
        discount: normalizedDiscount * 0.4,
        dealSize: normalizedSize * 0.2,
        pipeline: normalizedPipeline * 0.2,
        closeRate: normalizedClose * 0.2,
      },
    });
  }

  return deals;
}

export const deals = generateDeals();

export function getWaterfallData(filtered: Deal[]) {
  const totalList = filtered.reduce((s, d) => s + d.listPrice, 0);
  const totalVolume = filtered.reduce((s, d) => s + d.listPrice * d.volumeDiscount, 0);
  const totalPromo = filtered.reduce((s, d) => s + d.listPrice * d.promoDiscount, 0);
  const totalPartner = filtered.reduce((s, d) => s + d.listPrice * d.partnerDiscount, 0);
  const totalNet = filtered.reduce((s, d) => s + d.netPrice, 0);
  const totalRealized = filtered.reduce((s, d) => s + d.realizedRevenue, 0);
  const realization = totalNet - totalRealized;

  const m = 1_000_000;
  return {
    bars: [
      { name: "List Price", value: totalList / m, base: 0, fill: "#3b82f6", type: "start" },
      { name: "Volume Disc.", value: -totalVolume / m, base: totalList / m, fill: "#ef4444", type: "decrease" },
      { name: "Promo Disc.", value: -totalPromo / m, base: (totalList - totalVolume) / m, fill: "#f97316", type: "decrease" },
      { name: "Partner Disc.", value: -totalPartner / m, base: (totalList - totalVolume - totalPromo) / m, fill: "#eab308", type: "decrease" },
      { name: "Net Price", value: totalNet / m, base: 0, fill: "#8b5cf6", type: "subtotal" },
      { name: "Rev. Leakage", value: -realization / m, base: totalNet / m, fill: "#ec4899", type: "decrease" },
      { name: "Realized Rev.", value: totalRealized / m, base: 0, fill: "#22c55e", type: "end" },
    ],
    summary: {
      totalList: totalList / m,
      totalNet: totalNet / m,
      totalRealized: totalRealized / m,
      totalDiscounts: (totalVolume + totalPromo + totalPartner) / m,
      avgDiscountRate:
        filtered.reduce((s, d) => s + d.totalDiscountRate, 0) / filtered.length,
      realizationRate: totalRealized / totalNet,
      corridorViolations: filtered.filter((d) => d.corridorStatus === "red").length,
    },
  };
}
