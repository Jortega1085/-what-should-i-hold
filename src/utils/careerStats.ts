import { CareerStats } from "../types";

export function getDefaultCareerStats(): CareerStats {
  return {
    totalHands: 0,
    correctDecisions: 0,
    totalRTPGained: 0,
    totalRTPLost: 0,
    mistakesByGame: {},
    mistakesBySeverity: {
      "Excellent": 0,
      "Minor mistake": 0,
      "Moderate mistake": 0,
      "Major mistake": 0,
      "Severe mistake": 0
    },
    sessionsByDate: {},
    bestStreak: 0,
    currentStreak: 0,
    startDate: new Date().toISOString().split('T')[0],
    lastPlayed: new Date().toISOString().split('T')[0],
    handsPerGame: {}
  };
}

export function loadCareerStats(): CareerStats {
  try {
    const saved = localStorage.getItem('videoPokerCareerStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fix for old incorrect RTP calculation
      if (parsed.totalRTPLost && parsed.totalRTPLost > 10) {
        // The value was incorrectly multiplied by 10000 (100 twice)
        // So divide by 10000 to get the correct decimal value
        parsed.totalRTPLost = parsed.totalRTPLost / 10000;
        // Also fix session data
        if (parsed.sessionsByDate) {
          Object.values(parsed.sessionsByDate).forEach((session: any) => {
            if (session.rtpLost && session.rtpLost > 10) {
              session.rtpLost = session.rtpLost / 10000;
            }
          });
        }
      }
      // Ensure all required fields exist (for backwards compatibility)
      return { ...getDefaultCareerStats(), ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load career stats:', error);
  }
  return getDefaultCareerStats();
}

export function saveCareerStats(stats: CareerStats): void {
  try {
    localStorage.setItem('videoPokerCareerStats', JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save career stats:', error);
  }
}

export function loadGameVariant(): string {
  try {
    return localStorage.getItem('videoPokerGameVariant') || 'Jacks or Better 9/6';
  } catch (error) {
    return 'Jacks or Better 9/6';
  }
}

export function saveGameVariant(game: string): void {
  try {
    localStorage.setItem('videoPokerGameVariant', game);
  } catch (error) {
    console.warn('Failed to save game variant:', error);
  }
}

export function updateCareerStats(
  currentStats: CareerStats,
  correct: boolean,
  game: string,
  mistakeCost: number,
  severity: string
): CareerStats {
  const today = new Date().toISOString().split('T')[0];
  const newStats = { ...currentStats };

  // Update basic counters
  newStats.totalHands += 1;
  if (correct) {
    newStats.correctDecisions += 1;
    newStats.currentStreak += 1;
    newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
  } else {
    newStats.currentStreak = 0;
    newStats.totalRTPLost += mistakeCost;
  }

  // Track by game variant
  if (!newStats.handsPerGame[game]) {
    newStats.handsPerGame[game] = { played: 0, correct: 0 };
  }
  newStats.handsPerGame[game].played += 1;
  if (correct) {
    newStats.handsPerGame[game].correct += 1;
  }

  // Track mistakes by game and severity
  if (!correct) {
    newStats.mistakesByGame[game] = (newStats.mistakesByGame[game] || 0) + 1;
    newStats.mistakesBySeverity[severity] = (newStats.mistakesBySeverity[severity] || 0) + 1;
  }

  // Track daily sessions
  if (!newStats.sessionsByDate[today]) {
    newStats.sessionsByDate[today] = { hands: 0, correct: 0, rtpGained: 0, rtpLost: 0 };
  }
  newStats.sessionsByDate[today].hands += 1;
  if (correct) {
    newStats.sessionsByDate[today].correct += 1;
  } else {
    newStats.sessionsByDate[today].rtpLost += mistakeCost;
  }

  newStats.lastPlayed = today;

  return newStats;
}