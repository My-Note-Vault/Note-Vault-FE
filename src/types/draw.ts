export type DrawCategory = "NEW_MEMBER" | "DOCUMENT_WRITER";

export interface DrawResult {
  category: DrawCategory;
  winnerMemberId: number | null;
  winnerName: string | null;
  eligibleCount: number;
}

export interface DrawEligibleCount {
  category: DrawCategory;
  count: number;
  participating: boolean;
}

export interface DrawDay {
  drawDate: string;
  drawnAt: string;
  results: DrawResult[];
}

export interface DrawOverview {
  eligibleCounts: DrawEligibleCount[];
  days: DrawDay[];
}
