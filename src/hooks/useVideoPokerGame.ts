import { useState, useMemo } from 'react';
import { getRandomHand, getOptimalHoldForGame } from '../logic/solver';
import { PAYTABLES } from '../data/paytables';
import { HistoryEntry } from "../types";

export function useVideoPokerGame(gameVariant: string) {
  const [cards, setCards] = useState<string[]>(() => getRandomHand());
  const [playerHold, setPlayerHold] = useState<number[]>([]);
  const [score, setScore] = useState({ played: 0, correct: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const paytable = PAYTABLES[gameVariant];

  const optimalHold = useMemo(() => {
    try {
      return getOptimalHoldForGame(cards, paytable, gameVariant);
    } catch (error) {
      return { hold: [], ev: 0 };
    }
  }, [cards, paytable, gameVariant]);

  const dealRandom = () => {
    setCards(getRandomHand());
    setPlayerHold([]);
  };

  const toggleHold = (index: number) => {
    if (playerHold.includes(index)) {
      setPlayerHold(playerHold.filter(i => i !== index));
    } else {
      setPlayerHold([...playerHold, index]);
    }
  };

  const checkHold = () => {
    const playerSorted = playerHold.slice().sort();
    const optimalSorted = optimalHold.hold.slice().sort();
    const correct = playerSorted.length === optimalSorted.length &&
      playerSorted.every((x, i) => x === optimalSorted[i]);

    setScore(s => ({
      played: s.played + 1,
      correct: s.correct + (correct ? 1 : 0)
    }));

    const newEntry: HistoryEntry = {
      cards,
      playerHold,
      optimalHold: optimalHold.hold.slice(),
      correct,
      gameVariant,
      optimalEv: optimalHold.ev
    };

    setHistory(h => [newEntry, ...h.slice(0, 9)]);

    return { correct, optimalHold };
  };

  const setCustomCards = (newCards: string[]) => {
    setCards(newCards);
    setPlayerHold([]);
  };

  return {
    cards,
    playerHold,
    score,
    history,
    optimalHold,
    paytable,
    dealRandom,
    toggleHold,
    checkHold,
    setCustomCards,
    setPlayerHold
  };
}