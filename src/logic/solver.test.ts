import { evaluateHand, expectedValue, rank, suit, getOptimalHoldForGame } from './solver';
import { PAYTABLES } from '../data/paytables';

describe('Hand Evaluation', () => {
  const paytable = PAYTABLES['Jacks or Better 9/6'];

  test('recognizes royal flush correctly', () => {
    const hand = ['AS', 'KS', 'QS', 'JS', '10S'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('ROYAL');
    expect(result.payout).toBe(800);
    expect(result.name).toBe('Royal Flush');
  });

  test('recognizes straight flush correctly', () => {
    const hand = ['9H', '8H', '7H', '6H', '5H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('STRAIGHT_FLUSH');
    expect(result.payout).toBe(50);
  });

  test('recognizes four of a kind', () => {
    const hand = ['KH', 'KD', 'KC', 'KS', '2H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('FOUR_KIND');
    expect(result.payout).toBe(25);
  });

  test('recognizes full house', () => {
    const hand = ['QH', 'QD', 'QC', '7S', '7H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('FULL_HOUSE');
    expect(result.payout).toBe(9);
  });

  test('recognizes flush', () => {
    const hand = ['AD', '9D', '7D', '5D', '2D'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('FLUSH');
    expect(result.payout).toBe(6);
  });

  test('recognizes straight', () => {
    const hand = ['5C', '4D', '3H', '2S', 'AH'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('STRAIGHT');
    expect(result.payout).toBe(4);
  });

  test('recognizes three of a kind', () => {
    const hand = ['8H', '8D', '8C', 'KS', '2H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('THREE_KIND');
    expect(result.payout).toBe(3);
  });

  test('recognizes two pair', () => {
    const hand = ['JH', 'JD', '5C', '5S', '2H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('TWO_PAIR');
    expect(result.payout).toBe(2);
  });

  test('recognizes jacks or better', () => {
    const hand = ['AH', 'AD', '8C', '5S', '2H'];
    const result = evaluateHand(hand, paytable);
    expect(result.key).toBe('JacksOrBetter');
    expect(result.payout).toBe(1);
  });

  test('recognizes low pair (no payout)', () => {
    const hand = ['7H', '7D', 'KC', 'QS', '2H'];
    const result = evaluateHand(hand, paytable);
    expect(result.payout).toBe(0);
    expect(result.name).toBe('Pair of 7s');
  });

  test('recognizes high card (no payout)', () => {
    const hand = ['AH', 'KD', 'QC', 'JS', '9H'];
    const result = evaluateHand(hand, paytable);
    expect(result.payout).toBe(0);
    expect(result.name).toBe('Ace High');
  });
});

describe('Card Helper Functions', () => {
  test('rank extracts correct rank', () => {
    expect(rank('AS')).toBe('A');
    expect(rank('10H')).toBe('10');
    expect(rank('2C')).toBe('2');
    expect(rank('KD')).toBe('K');
  });

  test('suit extracts correct suit', () => {
    expect(suit('AS')).toBe('♠');
    expect(suit('KH')).toBe('♥');
    expect(suit('QD')).toBe('♦');
    expect(suit('JC')).toBe('♣');
  });
});

describe('Optimal Hold Calculation', () => {
  test('holds royal flush', () => {
    const hand = ['AS', 'KS', 'QS', 'JS', '10S'];
    const paytable = PAYTABLES['Jacks or Better 9/6'];
    const result = getOptimalHoldForGame(hand, paytable, 'Jacks or Better 9/6');

    expect(result.hold).toEqual([0, 1, 2, 3, 4]);
    expect(result.ev).toBeGreaterThan(799); // Should be close to 800
  });

  test('holds high pair over low cards', () => {
    const hand = ['AH', 'AD', '7C', '5S', '2H'];
    const paytable = PAYTABLES['Jacks or Better 9/6'];
    const result = getOptimalHoldForGame(hand, paytable, 'Jacks or Better 9/6');

    expect(result.hold.sort()).toEqual([0, 1]); // Hold the aces
    expect(result.ev).toBeGreaterThan(1); // At least pays 1-for-1
  });

  test('prefers 4-card flush over low pair', () => {
    const hand = ['7H', '7D', 'KH', 'QH', '9H'];
    const paytable = PAYTABLES['Jacks or Better 9/6'];
    const result = getOptimalHoldForGame(hand, paytable, 'Jacks or Better 9/6');

    // Should hold the 4 hearts for flush draw
    expect(result.hold.length).toBe(4);
    expect(result.hold).toContain(2); // KH
    expect(result.hold).toContain(3); // QH
    expect(result.hold).toContain(4); // 9H
  });

  test('holds nothing from complete garbage hand', () => {
    const hand = ['7C', '5D', '3H', '2S', '9H'];
    const paytable = PAYTABLES['Jacks or Better 9/6'];
    const result = getOptimalHoldForGame(hand, paytable, 'Jacks or Better 9/6');

    expect(result.hold).toEqual([]); // Discard everything
    expect(result.ev).toBeLessThan(1); // Low expected value
  });
});

describe('Expected Value Calculation', () => {
  const paytable = PAYTABLES['Jacks or Better 9/6'];

  test('calculates EV for made hand correctly', () => {
    const hand = ['JH', 'JD', '5C', '5S', '2H'];
    const hold = [0, 1, 2, 3]; // Hold two pair
    const ev = expectedValue(hand, hold, paytable);

    expect(ev).toBe(2); // Two pair pays 2-for-1
  });

  test('calculates EV for drawing hand', () => {
    const hand = ['AH', 'KH', 'QH', 'JH', '7C'];
    const hold = [0, 1, 2, 3]; // Hold 4 to a straight flush
    const ev = expectedValue(hand, hold, paytable);

    // Should have decent EV for straight flush draw
    expect(ev).toBeGreaterThan(1);
    expect(ev).toBeLessThan(50); // Less than straight flush payout
  });
});