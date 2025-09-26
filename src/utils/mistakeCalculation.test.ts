import { calculateMistakeSeverity } from './mistakeCalculation';

// Mock paytable for testing
const mockPaytable = {
  ROYAL: 800,
  STRAIGHT_FLUSH: 50,
  FOUR_KIND: 25,
  FULL_HOUSE: 9,
  FLUSH: 6,
  STRAIGHT: 4,
  THREE_KIND: 3,
  TWO_PAIR: 2,
  JACKS_OR_BETTER: 1
};

// Mock expectedValue function
jest.mock('../logic/solver', () => ({
  expectedValue: jest.fn((cards, hold, paytable) => {
    // Return different values based on hold length for testing
    if (hold.length === 0) return 0.5; // Draw all
    if (hold.length === 2) return 0.8; // Hold pair
    if (hold.length === 4) return 0.7; // Hold 4 cards
    return 0.6; // Default
  })
}));

describe('Mistake Calculation', () => {
  const testCards = ['AS', 'KH', 'QD', 'JC', '10S'];

  test('identifies excellent play (no difference)', () => {
    const result = calculateMistakeSeverity(
      [0, 1], // Player hold
      { hold: [0, 1], ev: 0.8 }, // Optimal hold (same)
      testCards,
      mockPaytable
    );

    expect(result.severity).toBe('Excellent');
    expect(result.color).toBe('text-green-600');
    expect(result.difference).toBe(0);
    expect(result.playerEV).toBe(0.8);
    expect(result.optimalEV).toBe(0.8);
  });

  test('identifies minor mistake (small difference)', () => {
    const result = calculateMistakeSeverity(
      [0, 1], // Player hold (EV: 0.8)
      { hold: [0, 1, 2, 3], ev: 0.9 }, // Optimal hold (EV: 0.9)
      testCards,
      mockPaytable
    );

    expect(result.severity).toBe('Minor mistake');
    expect(result.color).toBe('text-yellow-600');
    expect(result.difference).toBeCloseTo(0.1, 2);
  });

  test('identifies moderate mistake', () => {
    const result = calculateMistakeSeverity(
      [], // Player draws all (EV: 0.5)
      { hold: [0, 1], ev: 0.8 }, // Optimal hold pair (EV: 0.8)
      testCards,
      mockPaytable
    );

    expect(result.severity).toBe('Moderate mistake');
    expect(result.color).toBe('text-orange-600');
    expect(result.difference).toBeCloseTo(0.3, 2);
  });

  test('identifies major mistake', () => {
    // Mock a large difference
    const { expectedValue } = require('../logic/solver');
    expectedValue.mockImplementationOnce(() => 0.2); // Player EV
    expectedValue.mockImplementationOnce(() => 0.9); // Optimal EV

    const result = calculateMistakeSeverity(
      [0], // Player hold
      { hold: [0, 1, 2], ev: 0 }, // Optimal hold (ev will be recalculated)
      testCards,
      mockPaytable
    );

    expect(result.severity).toBe('Major mistake');
    expect(result.color).toBe('text-red-600');
    expect(result.difference).toBeCloseTo(0.7, 2);
  });

  test('identifies severe mistake', () => {
    // Mock a very large difference
    const { expectedValue } = require('../logic/solver');
    expectedValue.mockImplementationOnce(() => 0.1); // Player EV
    expectedValue.mockImplementationOnce(() => 1.5); // Optimal EV

    const result = calculateMistakeSeverity(
      [4], // Player hold
      { hold: [0, 1, 2, 3], ev: 0 }, // Optimal hold
      testCards,
      mockPaytable
    );

    expect(result.severity).toBe('Severe mistake');
    expect(result.color).toBe('text-red-800');
    expect(result.difference).toBeCloseTo(1.4, 2);
  });

  test('handles errors gracefully', () => {
    const { expectedValue } = require('../logic/solver');
    expectedValue.mockImplementationOnce(() => {
      throw new Error('Calculation error');
    });

    const result = calculateMistakeSeverity(
      [0, 1],
      { hold: [2, 3], ev: 0.75 },
      testCards,
      mockPaytable
    );

    expect(result.playerEV).toBe(0); // Defaults to 0 on error
    expect(result.optimalEV).toBe(0.75);
    expect(result.difference).toBe(0.75);
  });

  test('recalculates optimal EV when not provided', () => {
    const { expectedValue } = require('../logic/solver');
    expectedValue.mockImplementationOnce(() => 0.5); // Player EV
    expectedValue.mockImplementationOnce(() => 0.85); // Recalculated optimal EV

    const result = calculateMistakeSeverity(
      [],
      { hold: [0, 1], ev: 0 }, // EV is 0, will be recalculated
      testCards,
      mockPaytable
    );

    expect(result.optimalEV).toBe(0.85);
    expect(result.playerEV).toBe(0.5);
    expect(result.difference).toBeCloseTo(0.35, 2);
  });
});