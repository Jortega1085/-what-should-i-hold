import { expectedValue } from '../logic/solver';

export interface MistakeSeverityResult {
  playerEV: number;
  optimalEV: number;
  difference: number;
  severity: string;
  color: string;
  severityDescription: string;
}

export function calculateMistakeSeverity(
  playerHold: number[],
  optimalHold: { hold: number[], ev: number },
  cards: string[],
  paytable: Record<string, number>
): MistakeSeverityResult {
  let playerEV: number;
  try {
    playerEV = expectedValue(cards, playerHold, paytable);
  } catch (error) {
    playerEV = 0;
  }

  // Use the pre-calculated optimal EV directly, no need to recalculate
  const optimalEV = optimalHold.ev;

  const difference = optimalEV - playerEV;

  let severity = "";
  let color = "";
  let severityDescription = "";

  if (difference <= 0.05) {
    severity = "Excellent";
    color = "text-green-600";
    severityDescription = "Perfect or near-perfect play! Your decision was optimal or very close to it.";
  } else if (difference <= 0.2) {
    severity = "Minor mistake";
    color = "text-yellow-600";
    severityDescription = "Small error with minimal impact. You chose a decent alternative but missed the optimal play.";
  } else if (difference <= 0.5) {
    severity = "Moderate mistake";
    color = "text-orange-600";
    severityDescription = "Noticeable error that hurts your returns. This decision significantly reduces your expected value.";
  } else if (difference <= 1.0) {
    severity = "Major mistake";
    color = "text-red-600";
    severityDescription = "Serious strategic error! This choice dramatically reduces your winning potential.";
  } else {
    severity = "Severe mistake";
    color = "text-red-800";
    severityDescription = "Critical blunder! This decision is mathematically very poor and severely hurts your odds.";
  }

  return {
    playerEV,
    optimalEV,
    difference,
    severity,
    color,
    severityDescription
  };
}