import { useState, useEffect } from 'react';
import { CareerStats } from "../types";
import {
  getDefaultCareerStats,
  loadCareerStats,
  saveCareerStats,
  updateCareerStats
} from '../utils/careerStats';

export function useCareerStats() {
  const [careerStats, setCareerStats] = useState<CareerStats>(() => loadCareerStats());

  // Save to localStorage whenever stats change
  useEffect(() => {
    saveCareerStats(careerStats);
  }, [careerStats]);

  const recordHand = (
    correct: boolean,
    game: string,
    mistakeCost: number,
    severity: string
  ) => {
    const updatedStats = updateCareerStats(careerStats, correct, game, mistakeCost, severity);
    setCareerStats(updatedStats);
  };

  const resetStats = () => {
    const confirmReset = window.confirm(
      "⚠️ Are you sure you want to reset all career statistics?\n\n" +
      "This will permanently delete:\n" +
      "• All game history\n" +
      "• Accuracy records\n" +
      "• Best streaks\n" +
      "• Performance data\n\n" +
      "This action cannot be undone!"
    );

    if (confirmReset) {
      const defaultStats = getDefaultCareerStats();
      setCareerStats(defaultStats);
      saveCareerStats(defaultStats);
    }
  };

  return {
    careerStats,
    recordHand,
    resetStats
  };
}