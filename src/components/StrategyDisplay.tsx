import React from 'react';
import { motion } from 'framer-motion';
import { rank, suit, evaluateHand } from '../logic/solver';

interface StrategyDisplayProps {
  cards: string[];
  paytable: Record<string, number>;
  best: { hold: number[]; ev: number };
  game: string;
  getAllStrategyOptions: (cards: string[], paytable: Record<string, number>) => any[];
  getStrategyExplanation: (cards: string[], best: any, game: string) => string;
  getCardColor: (suit: string) => string;
}

export function StrategyDisplay({
  cards,
  paytable,
  best,
  game,
  getAllStrategyOptions,
  getStrategyExplanation,
  getCardColor,
}: StrategyDisplayProps) {
  const allOptions = getAllStrategyOptions(cards, paytable);
  const optimalOption = allOptions[0];
  const currentHand = evaluateHand(cards, paytable);
  const ranks = cards.map(rank);
  const suits = cards.map(suit);

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-xl font-bold mb-4">📊 Strategy Analysis</h3>

      {/* Current Hand Display */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Your Hand:</h4>
        <div className="flex gap-2 justify-center mb-4">
          {cards.map((c, i) => {
            const cardRank = rank(c);
            const cardSuit = suit(c);
            const colorClass = getCardColor(cardSuit);
            const isHeld = best.hold.includes(i);
            return (
              <div key={i} className={`relative w-14 h-20 rounded-lg border-2 bg-white shadow-md ${isHeld ? "border-green-500 bg-green-50" : "border-gray-300"}`}>
                <div className={`flex flex-col items-center justify-center h-full ${colorClass}`}>
                  <div className="text-base font-bold">{cardRank}</div>
                  <div className="text-lg">{cardSuit}</div>
                </div>
                {isHeld && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-1 py-0.5 rounded font-bold">
                    HOLD
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Options Comparison */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-800 mb-3">💡 Strategy Analysis & Options</h4>
        <div className="space-y-3">
          {/* Optimal Choice */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-green-800">🏆 OPTIMAL CHOICE</span>
              <span className="text-green-700 font-medium">RTP: {(optimalOption.ev * 100).toFixed(1)}%</span>
            </div>
            <div className="text-green-700">
              <div className="mb-1">
                <strong>Hold:</strong> {optimalOption.hold.length > 0 ? optimalOption.hold.map((i: number) => cards[i]).join(", ") : "None (Draw 5)"}
              </div>
              <div className="text-sm">
                <strong>Why:</strong> {getStrategyExplanation(cards, best, game)}
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          {allOptions.slice(1, 3).map((option, idx) => {
            const difference = optimalOption.ev - option.ev;
            let severityColor = difference <= 0.1 ? "yellow" : difference <= 0.5 ? "orange" : "red";
            return (
              <div key={idx} className={`bg-${severityColor}-50 border border-${severityColor}-200 rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-${severityColor}-800`}>#{idx + 2} Alternative</span>
                  <div className="text-right text-sm">
                    <div className={`text-${severityColor}-700 font-medium`}>RTP: {(option.ev * 100).toFixed(1)}%</div>
                    <div className={`text-${severityColor}-600 text-xs`}>Cost: -{(difference * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className={`text-${severityColor}-700 text-sm`}>
                  <strong>Hold:</strong> {option.hold.length > 0 ? option.hold.map((i: number) => cards[i]).join(", ") : "None"} - {option.description}
                </div>
              </div>
            );
          })}

          {/* Detailed Strategic Reasoning */}
          <StrategicReasoning
            cards={cards}
            paytable={paytable}
            currentHand={currentHand}
            ranks={ranks}
            suits={suits}
            best={best}
          />
        </div>
      </div>

      {/* Player Hold Analysis */}
      <PlayerHoldAnalysis
        cards={cards}
        paytable={paytable}
        best={best}
      />
    </motion.div>
  );
}

function StrategicReasoning({
  cards,
  paytable,
  currentHand,
  ranks,
  suits,
  best
}: {
  cards: string[];
  paytable: Record<string, number>;
  currentHand: any;
  ranks: string[];
  suits: string[];
  best: { hold: number[]; ev: number };
}) {
  // Check for made hands
  if (currentHand.payout > 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <h5 className="font-semibold text-gray-800 mb-2">📋 Strategic Reasoning:</h5>
        <div className="text-sm text-gray-700 space-y-1">
          <div>• <strong>Current Hand:</strong> {currentHand.name} (pays {currentHand.payout}x)</div>
          <div>• <strong>Decision:</strong> Hold paying hand - guaranteed return beats any draw</div>
          <div>• <strong>Risk:</strong> Zero risk vs. uncertain improvement from draws</div>
        </div>
      </div>
    );
  }

  // Check for draws
  const suitCounts: {[key: string]: number} = {};
  suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
  const flushDraw = Object.values(suitCounts).some(count => count === 4);

  const pairs: number[] = [];
  const rankCounts: {[key: string]: number[]} = {};
  ranks.forEach((r, i) => {
    if (!rankCounts[r]) rankCounts[r] = [];
    rankCounts[r].push(i);
  });

  for (const positions of Object.values(rankCounts)) {
    if (positions.length === 2) {
      pairs.push(...positions);
      break;
    }
  }

  const highCards = [0,1,2,3,4].filter(i => ['J', 'Q', 'K', 'A'].includes(ranks[i]));

  let reasoning = null;

  if (flushDraw) {
    reasoning = (
      <div>
        <div>• <strong>4-Card Flush Draw:</strong> 9 cards complete flush (19% chance)</div>
        <div>• <strong>Why Better:</strong> Flush pays {paytable.FLUSH}x, much higher than pair attempts</div>
        <div>• <strong>Math:</strong> 9 outs from 47 cards = 19.1% success rate</div>
      </div>
    );
  } else if (pairs.length === 2) {
    const pairRank = ranks[pairs[0]];
    reasoning = (
      <div>
        <div>• <strong>Pair:</strong> {pairRank}s - {['J', 'Q', 'K', 'A'].includes(pairRank) ? 'Paying pair' : 'Low pair'}</div>
        <div>• <strong>Improvement:</strong> Can make trips (11.8%), full house (1%), or quads (0.3%)</div>
        <div>• <strong>Decision:</strong> Hold pair, draw 3 for improvement chances</div>
      </div>
    );
  } else if (highCards.length >= 2) {
    reasoning = (
      <div>
        <div>• <strong>High Cards:</strong> {highCards.map(i => ranks[i]).join(', ')}</div>
        <div>• <strong>Each Card:</strong> ~13% chance to make paying pair</div>
        <div>• <strong>Decision:</strong> Hold high cards for best pairing chances</div>
      </div>
    );
  } else if (best.hold.length === 0) {
    reasoning = (
      <div>
        <div>• <strong>Nothing:</strong> No pairs, no draws, no high cards</div>
        <div>• <strong>Decision:</strong> Draw 5 new cards for fresh start</div>
        <div>• <strong>Chances:</strong> ~2.1% for pair+, ~0.5% for two pair+</div>
      </div>
    );
  } else {
    reasoning = (
      <div>
        <div>• <strong>Hold:</strong> {best.hold.map((i: number) => cards[i]).join(', ')}</div>
        <div>• <strong>Decision:</strong> Mathematical edge over other options</div>
        <div>• <strong>Expected Value:</strong> {(best.ev * 100).toFixed(1)}% RTP</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 mt-3">
      <h5 className="font-semibold text-gray-800 mb-2">📋 Strategic Reasoning:</h5>
      <div className="text-sm text-gray-700 space-y-1">
        {reasoning}
      </div>
    </div>
  );
}

function PlayerHoldAnalysis({
  cards,
  paytable,
  best
}: {
  cards: string[];
  paytable: Record<string, number>;
  best: { hold: number[]; ev: number };
}) {
  const [playerHold, setPlayerHold] = React.useState<number[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);

  const toggleHold = (index: number) => {
    setPlayerHold(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
    setShowComparison(true);
  };

  if (!showComparison) return null;

  const calculateMistakeSeverity = (playerHold: number[], optimalHold: { hold: number[], ev: number }) => {
    // This is a simplified version - you'd need the actual function
    const difference = optimalHold.ev - 0; // Would need to calculate actual playerEV
    return {
      playerEV: 0,
      optimalEV: optimalHold.ev,
      difference,
      severity: difference <= 0.05 ? "Excellent" : difference <= 0.2 ? "Minor" : "Major",
      color: difference <= 0.05 ? "text-green-600" : difference <= 0.2 ? "text-yellow-600" : "text-red-600",
    };
  };

  const comparison = calculateMistakeSeverity(playerHold, best);

  return (
    <div className="border-t pt-3">
      <h4 className="font-semibold mb-3">🎯 Your Analysis:</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="text-gray-600">Your Hold:</div>
          <div className="font-medium">
            {playerHold.length > 0 ? playerHold.map((i: number) => cards[i]).join(', ') : 'None'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-600">Optimal Hold:</div>
          <div className="font-medium text-green-600">
            {best.hold.length > 0 ? best.hold.map((i: number) => cards[i]).join(', ') : 'None'}
          </div>
        </div>
      </div>
    </div>
  );
}