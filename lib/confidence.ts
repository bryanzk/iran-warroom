export interface ConfidenceInput {
  independentSources: number;
  recencyHours: number;
  contested?: boolean;
}

/**
 * Simple confidence heuristic for display ordering.
 */
export function calculateConfidence(input: ConfidenceInput): number {
  const sourceScore = Math.min(input.independentSources / 4, 1);
  const recencyPenalty = Math.min(input.recencyHours / 48, 1) * 0.25;
  const contestedPenalty = input.contested ? 0.2 : 0;
  const raw = 0.4 + sourceScore * 0.6 - recencyPenalty - contestedPenalty;

  return Math.max(0, Math.min(1, Number(raw.toFixed(2))));
}
