import { rank, suit, RANK_ORDER, evaluateHand } from '../logic/solver';
import { PAYTABLES } from '../data/paytables';

export function getPlayerStrategyExplanation(cards: string[], playerHold: number[], playerEV: number, game: string): string {
  if (playerHold.length === 0) {
    return "🎲 Drew 5 new cards - discarded entire hand for fresh start.";
  }

  if (playerHold.length === 5) {
    const currentHand = evaluateHand(cards, PAYTABLES[game]);
    return `🃏 Kept entire hand (${currentHand.name}) - ${currentHand.payout > 0 ? `pays ${currentHand.payout}x` : 'no payout'}.`;
  }

  // Analyze what the player actually held
  const heldCards = playerHold.map(i => cards[i]);
  const heldRanks = heldCards.map(rank);
  const heldSuits = heldCards.map(suit);

  // Check for pairs in held cards
  const rankCounts: { [key: string]: number } = {};
  heldRanks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);

  const pairs = Object.entries(rankCounts).filter(([rank, count]) => count === 2);
  const trips = Object.entries(rankCounts).filter(([rank, count]) => count === 3);

  if (trips.length > 0) {
    const tripRank = trips[0][0];
    return `🎯 Kept three ${tripRank}s - strong hold with ~25% chance to improve to full house or four of a kind.`;
  }

  if (pairs.length > 0) {
    const pairRank = pairs[0][0];
    const pairValue = RANK_ORDER[pairRank] || 0;
    if (pairValue >= 11) {
      return `👑 Kept pair of ${pairRank}s - pays 1-for-1 immediately, ~11% chance to improve to trips or better.`;
    } else {
      return `🎲 Kept low pair (${pairRank}s) - doesn't pay now but ~27% chance to improve to paying hand.`;
    }
  }

  // Check for flush draws
  if (new Set(heldSuits).size === 1 && heldCards.length === 4) {
    return `🌊 Kept 4-card ${heldSuits[0]} flush draw - 19% chance (9/47) to complete flush for ${PAYTABLES[game].FLUSH}x payout.`;
  }

  // Check for 3-card flush draws
  if (new Set(heldSuits).size === 1 && heldCards.length === 3) {
    return `🌊 Kept 3-card ${heldSuits[0]} flush draw (${heldCards.join(', ')}) - only ~4% chance to complete flush, usually not optimal.`;
  }

  // Check for high cards
  const highCards = heldCards.filter(c => ['J', 'Q', 'K', 'A'].includes(rank(c)));
  if (highCards.length > 0) {
    if (game === "Double Double Bonus" && heldCards.some(c => rank(c) === 'A')) {
      return `🎯 Kept ${highCards.map(c => rank(c)).join(', ')} - in Double Double Bonus, Aces are especially valuable for bonus payouts.`;
    }
    return `👑 Kept high cards: ${highCards.map(c => rank(c)).join(', ')} - each has ~13% chance to pair for 1-for-1 payout.`;
  }

  return `🤔 Kept ${heldCards.join(', ')} - unusual hold with estimated ${(playerEV * 100).toFixed(1)}% RTP.`;
}

export function getStrategyExplanation(cards: string[], bestHold: { hold: number[], ev: number }, game: string): string {
  const currentHand = evaluateHand(cards, PAYTABLES[game]);
  const ranks = cards.map(rank);
  const suits = cards.map(suit);

  // Made hands
  if (currentHand.payout > 0) {
    if (currentHand.key === "ROYAL") return "🏆 Royal Flush! This is the highest paying hand - always hold all 5 cards.";
    if (currentHand.key === "STRAIGHT_FLUSH") return "🔥 Straight Flush! Hold all 5 cards for the second highest payout.";
    if (currentHand.key === "FOUR_KIND") return "💎 Four of a Kind! Hold all 5 cards for a guaranteed big payout.";
    if (currentHand.key === "FULL_HOUSE") return "🏠 Full House! Hold all 5 cards - this pays well in all variants.";
    if (currentHand.key === "FLUSH") return "🌊 Flush! Hold all 5 cards for a solid payout.";
    if (currentHand.key === "STRAIGHT") return "📈 Straight! Hold all 5 cards for a decent payout.";
    if (currentHand.key === "THREE_KIND") return `🎯 Three of a Kind (${ranks[bestHold.hold[0]]}s)! Hold the three matching cards and draw 2 new ones.`;
    if (currentHand.key === "TWO_PAIR") return "👥 Two Pair! Hold both pairs and draw 1 card for the full house chance.";
    if (currentHand.key === "JacksOrBetter") return `👑 Pair of ${ranks[bestHold.hold[0]]}s! This pair pays 1-for-1. Hold the pair and draw 3 cards.`;
  }

  // Draw situations
  if (bestHold.hold.length === 4) {
    const heldSuits = bestHold.hold.map(i => suits[i]);
    const heldRanks = bestHold.hold.map(i => ranks[i]);

    // 4-card flush
    if (new Set(heldSuits).size === 1) {
      return `🌊 4-Card Flush Draw (${heldSuits[0]})! You have a 19% chance (9/47 cards) to complete the flush. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }

    // 4-card straight
    const sortedValues = heldRanks.map(r => RANK_ORDER[r]).sort((a, b) => b - a);
    let isConsecutive = true;
    for (let i = 1; i < sortedValues.length; i++) {
      if (sortedValues[i - 1] - sortedValues[i] !== 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) {
      return `📈 4-Card Straight Draw! You need 8 cards to complete the straight. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }
  }

  if (bestHold.hold.length === 3) {
    const heldRanks = bestHold.hold.map(i => ranks[i]);
    const heldSuits = bestHold.hold.map(i => suits[i]);

    // 3-card royal
    const royals = ['10', 'J', 'Q', 'K', 'A'];
    if (new Set(heldSuits).size === 1 && heldRanks.every(r => royals.includes(r))) {
      return `👑 3-Card Royal Flush Draw! You have a chance at the royal flush (2 cards) or other strong hands. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }
  }

  // High cards
  if (bestHold.hold.length <= 2 && bestHold.hold.length > 0) {
    const heldRanks = bestHold.hold.map(i => ranks[i]);
    const highCards = heldRanks.filter(r => ['J', 'Q', 'K', 'A'].includes(r));

    if (highCards.length > 0) {
      if (game === "Double Double Bonus" && heldRanks.includes('A')) {
        return `🎯 Hold the Ace(s)! In Double Double Bonus, Aces are especially valuable for bonus payouts. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
      }
      return `👑 Hold High Card(s): ${heldRanks.join(', ')}. These can form paying pairs (Jacks or Better). RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }

    // Low pair
    const pairRank = heldRanks[0];
    if (heldRanks.length === 2 && heldRanks[0] === heldRanks[1]) {
      if (game === "Double Double Bonus") {
        return `🎲 Low Pair (${pairRank}s) in Double Double Bonus. Low pairs can improve to trips or full house, and sometimes beat high card draws. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
      }
      return `🎲 Low Pair (${pairRank}s). While this doesn't pay now, it can improve to trips or better. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
    }
  }

  // Draw 5
  if (bestHold.hold.length === 0) {
    return `🎲 Draw 5 New Cards! No profitable holds found. This gives you a fresh chance at any hand. RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
  }

  return `Hold ${bestHold.hold.length} cards with RTP: ${(bestHold.ev * 100).toFixed(1)}%`;
}