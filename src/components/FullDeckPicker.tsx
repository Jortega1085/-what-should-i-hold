import React from "react";

import { SUITS, RANKS, rank, suit } from "../logic/solver";

interface FullDeckPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCards: (cards: string[]) => void;
  selectedCards: string[];
  setSelectedCards: (cards: string[]) => void;
  getCardColor: (cardSuit: string) => string;
}

export function FullDeckPicker({
  isOpen,
  onClose,
  onSelectCards,
  selectedCards,
  setSelectedCards,
  getCardColor,
}: FullDeckPickerProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">🃏 Select Your 5-Card Hand</h3>
          <div className="text-xl font-medium text-blue-600">
            Selected: {selectedCards.length}/5
          </div>
        </div>

        {selectedCards.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3">Your Selected Hand:</h4>
            <div className="flex gap-3 justify-center">
              {selectedCards.map(card => {
                const cardRank = rank(card);
                const cardSuit = suit(card);
                const colorClass = getCardColor(cardSuit);
                return (
                  <div
                    key={card}
                    className="w-16 h-22 bg-white border-2 border-blue-500 rounded-lg text-base flex flex-col items-center justify-center shadow-lg"
                  >
                    <div className={`${colorClass} font-bold text-lg`}>{cardRank}</div>
                    <div className={`${colorClass} text-2xl`}>{cardSuit}</div>
                  </div>
                );
              })}
              {Array(5 - selectedCards.length)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-16 h-22 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400"
                  >
                    <span className="text-3xl">?</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {SUITS.map(suitType => (
            <div key={suitType} className="border-2 rounded-lg p-4">
              <div className={`text-center text-2xl mb-3 font-bold ${getCardColor(suitType)}`}>
                {suitType === "♠" ? "♠ Spades"
                  : suitType === "♥" ? "♥ Hearts"
                  : suitType === "♦" ? "♦ Diamonds"
                  : "♣ Clubs"}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {RANKS.map(rankType => {
                  const cardCode = rankType + suitType;
                  const isSelected = selectedCards.includes(cardCode);
                  const colorClass = getCardColor(suitType);
                  return (
                    <button
                      key={cardCode}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCards(selectedCards.filter(c => c !== cardCode));
                        } else if (selectedCards.length < 5) {
                          setSelectedCards([...selectedCards, cardCode]);
                        }
                      }}
                      disabled={!isSelected && selectedCards.length >= 5}
                      className={`w-16 h-22 rounded-lg border-2 transition-all font-bold text-base flex flex-col items-center justify-center shadow-sm ${
                        isSelected
                          ? "border-blue-500 bg-blue-100 shadow-lg transform scale-110"
                          : selectedCards.length >= 5
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : `border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg hover:scale-105 ${colorClass}`
                      }`}
                    >
                      <div className="text-lg font-bold">{rankType}</div>
                      <div className="text-2xl">{suitType}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6 pt-4 border-t bg-white sticky bottom-0">
          <button
            onClick={() => {
              if (selectedCards.length === 5) {
                onSelectCards([...selectedCards]);
                setSelectedCards([]);
                onClose();
              }
            }}
            disabled={selectedCards.length !== 5}
            className={`px-8 py-3 rounded-lg font-bold text-lg ${
              selectedCards.length === 5
                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            ✅ Analyze This Hand
          </button>
          <button
            onClick={() => {
              setSelectedCards([]);
              onClose();
            }}
            className="px-6 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => setSelectedCards([])}
            className="px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Clear All ({selectedCards.length})
          </button>
        </div>
      </div>
    </div>
  );
}
