export const PAYTABLES: Record<string, Record<string, number>> = {
  "Jacks or Better 9/6": { ROYAL: 800, STRAIGHT_FLUSH: 50, FOUR_KIND: 25, FULL_HOUSE: 9, FLUSH: 6, STRAIGHT: 4, THREE_KIND: 3, TWO_PAIR: 2, JacksOrBetter: 1 },
  "Jacks or Better 8/5": { ROYAL: 800, STRAIGHT_FLUSH: 50, FOUR_KIND: 25, FULL_HOUSE: 8, FLUSH: 5, STRAIGHT: 4, THREE_KIND: 3, TWO_PAIR: 1, JacksOrBetter: 1 },
  "Double Bonus": {
    ROYAL: 800,
    STRAIGHT_FLUSH: 50,
    FOUR_ACES_WITH_234: 400,
    FOUR_2_4_WITH_A_4: 160,
    FOUR_ACES: 160,
    FOUR_2_4: 80,
    FOUR_5_K: 50,
    FULL_HOUSE: 9,
    FLUSH: 6,
    STRAIGHT: 4,
    THREE_KIND: 3,
    TWO_PAIR: 1,
    JacksOrBetter: 1
  },
  "Double Double Bonus": {
    ROYAL: 800,
    STRAIGHT_FLUSH: 50,
    FOUR_ACES_WITH_234: 400,
    FOUR_2_4_WITH_A_4: 160,
    FOUR_ACES: 160,
    FOUR_2_4: 80,
    FOUR_5_K: 50,
    FULL_HOUSE: 9,
    FLUSH: 6,
    STRAIGHT: 4,
    THREE_KIND: 3,
    TWO_PAIR: 1,
    JacksOrBetter: 1
  },
  "Bonus Poker": {
    ROYAL: 800,
    STRAIGHT_FLUSH: 50,
    FOUR_ACES_WITH_234: 160,
    FOUR_2_4_WITH_A_4: 80,
    FOUR_ACES: 80,
    FOUR_2_4: 40,
    FOUR_5_K: 25,
    FULL_HOUSE: 9,
    FLUSH: 6,
    STRAIGHT: 4,
    THREE_KIND: 3,
    TWO_PAIR: 1,
    JacksOrBetter: 1
  }
};
