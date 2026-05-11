export interface WarRoomInput {
  product: string;
  segment: string;
  region: string;
  listPrice: number;
  totalDiscountRate: number; // 0–100 percentage scale
  daysInPipeline: number;
  dealDescription?: string;
}

// ─── Tool data shapes (computed before AI calls) ───────────────────────────

export interface SimilarDealSummary {
  id: string;
  product: string;
  segment: string;
  totalDiscountRate: number;
  realizationRate: number;
  daysInPipeline: number;
  corridorStatus: string;
  riskLevel: string;
}

export interface DetectiveToolData {
  similarDeals: SimilarDealSummary[];
  avgDiscountRate: number;
  avgRealizationRate: number;
  avgDaysInPipeline: number;
  corridorViolationRate: number;
}

export interface ProsecutorToolData {
  projectedLeakage: number;
  annualizedRiskExposure: number;
  escalationProbability: "Low" | "Medium" | "High";
  worstCaseRealization: number; // percentage
}

export interface ArchitectToolData {
  recommendedTotalDiscount: number; // percentage
  discountToReduce: string;
  reductionAmount: number; // percentage points
  projectedRealizationImprovement: number; // percentage points
  approvalTier: string;
}

// ─── Agent output shapes ────────────────────────────────────────────────────

export interface DetectiveOutput {
  similarDealsFound: number;
  avgDiscountRate: number;
  avgRealizationRate: number;
  avgDaysInPipeline: number;
  corridorViolationRate: number;
  pattern: string;
}

export interface ProsecutorOutput {
  projectedLeakage: number;
  annualizedRiskExposure: number;
  escalationProbability: string;
  worstCaseRealization: number;
  prosecution: string;
}

export interface ArchitectOutput {
  recommendedTotalDiscount: number;
  discountToReduce: string;
  reductionAmount: number;
  projectedRealizationImprovement: number;
  approvalTier: string;
  architecture: string;
}

export interface OrchestratorOutput {
  decision: "APPROVE" | "ESCALATE" | "RENEGOTIATE";
  confidenceLevel: "High" | "Medium" | "Low";
  executiveSummary: string;
  primaryAction: string;
  revenueImpact: string;
}

// ─── Full response ──────────────────────────────────────────────────────────

export interface WarRoomResponse {
  detective: DetectiveOutput;
  prosecutor: ProsecutorOutput;
  architect: ArchitectOutput;
  orchestrator: OrchestratorOutput;
  durationMs: number;
}
