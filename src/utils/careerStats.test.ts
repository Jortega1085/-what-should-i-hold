import {
  getDefaultCareerStats,
  loadCareerStats,
  saveCareerStats,
  updateCareerStats
} from './careerStats';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Career Stats', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test('getDefaultCareerStats returns correct initial structure', () => {
    const stats = getDefaultCareerStats();
    expect(stats.totalHands).toBe(0);
    expect(stats.correctDecisions).toBe(0);
    expect(stats.totalRTPLost).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.mistakesBySeverity).toHaveProperty('Excellent');
    expect(stats.mistakesBySeverity).toHaveProperty('Minor mistake');
  });

  test('loadCareerStats returns default when no saved data', () => {
    const stats = loadCareerStats();
    expect(stats).toEqual(getDefaultCareerStats());
  });

  test('saveCareerStats and loadCareerStats work together', () => {
    const testStats = getDefaultCareerStats();
    testStats.totalHands = 10;
    testStats.correctDecisions = 8;

    saveCareerStats(testStats);
    const loaded = loadCareerStats();

    expect(loaded.totalHands).toBe(10);
    expect(loaded.correctDecisions).toBe(8);
  });

  test('updateCareerStats correctly updates for correct decision', () => {
    const initial = getDefaultCareerStats();
    const updated = updateCareerStats(initial, true, 'Jacks or Better 9/6', 0, 'Excellent');

    expect(updated.totalHands).toBe(1);
    expect(updated.correctDecisions).toBe(1);
    expect(updated.currentStreak).toBe(1);
    expect(updated.bestStreak).toBe(1);
    expect(updated.totalRTPLost).toBe(0);
  });

  test('updateCareerStats correctly updates for incorrect decision', () => {
    const initial = getDefaultCareerStats();
    initial.currentStreak = 5;
    initial.bestStreak = 5;

    const updated = updateCareerStats(initial, false, 'Jacks or Better 9/6', 0.15, 'Minor mistake');

    expect(updated.totalHands).toBe(1);
    expect(updated.correctDecisions).toBe(0);
    expect(updated.currentStreak).toBe(0); // Reset to 0
    expect(updated.bestStreak).toBe(5); // Unchanged
    expect(updated.totalRTPLost).toBe(0.15);
    expect(updated.mistakesBySeverity['Minor mistake']).toBe(1);
  });

  test('updateCareerStats tracks game-specific stats', () => {
    const initial = getDefaultCareerStats();
    let updated = updateCareerStats(initial, true, 'Jacks or Better 9/6', 0, 'Excellent');
    updated = updateCareerStats(updated, false, 'Jacks or Better 9/6', 0.1, 'Minor mistake');
    updated = updateCareerStats(updated, true, 'Double Double Bonus', 0, 'Excellent');

    expect(updated.handsPerGame['Jacks or Better 9/6'].played).toBe(2);
    expect(updated.handsPerGame['Jacks or Better 9/6'].correct).toBe(1);
    expect(updated.handsPerGame['Double Double Bonus'].played).toBe(1);
    expect(updated.handsPerGame['Double Double Bonus'].correct).toBe(1);
  });

  test('loadCareerStats migrates old corrupted RTP data', () => {
    // Simulate old corrupted data
    const corruptedStats = {
      ...getDefaultCareerStats(),
      totalRTPLost: 13118.5, // This was incorrectly multiplied by 10000
      sessionsByDate: {
        '2024-01-01': { hands: 10, correct: 5, rtpGained: 0, rtpLost: 5000 }
      }
    };

    localStorage.setItem('videoPokerCareerStats', JSON.stringify(corruptedStats));

    const loaded = loadCareerStats();
    expect(loaded.totalRTPLost).toBeCloseTo(1.31185, 5);
    expect(loaded.sessionsByDate['2024-01-01'].rtpLost).toBeCloseTo(0.5, 5);
  });
});