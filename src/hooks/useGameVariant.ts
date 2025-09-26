import { useState, useEffect } from 'react';
import { loadGameVariant, saveGameVariant } from '../utils/careerStats';

export function useGameVariant() {
  const [game, setGame] = useState<string>(() => loadGameVariant());

  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    saveGameVariant(newGame);
  };

  useEffect(() => {
    saveGameVariant(game);
  }, [game]);

  return {
    game,
    setGame: handleGameChange
  };
}