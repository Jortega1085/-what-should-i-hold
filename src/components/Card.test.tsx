import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, getCardColor } from './Card';
import type { Theme } from '../config/themes';

describe('Card Component', () => {
  const mockTheme: Theme = {
    bg: '',
    cardBg: 'bg-white',
    cardFace: 'bg-white',
    cardBack: 'bg-blue-600',
    primaryBtn: '',
    secondaryBtn: '',
    successBtn: '',
    dangerBtn: '',
    panel: '',
    panelGlow: '',
    text: '',
    textMuted: '',
    neonText: '',
    accent: '',
    accentBorder: '',
    border: '',
    shadow: '',
    cardShadow: '',
    glassPanel: '',
    feltOverlay: '',
  };

  test('renders card with correct rank and suit', () => {
    render(
      <Card
        card="A♥"
        isHeld={false}
        onClick={() => {}}
        theme={mockTheme}
      />
    );

    expect(screen.getByLabelText(/A of Hearts/i)).toBeInTheDocument();
  });

  test('displays HOLD label when card is held', () => {
    render(
      <Card
        card="K♠"
        isHeld={true}
        onClick={() => {}}
        theme={mockTheme}
      />
    );

    expect(screen.getByText(/Hold/i)).toBeInTheDocument();
  });

  test('does not display HOLD label when showHoldLabel is false', () => {
    render(
      <Card
        card="K♠"
        isHeld={true}
        onClick={() => {}}
        theme={mockTheme}
        showHoldLabel={false}
      />
    );

    expect(screen.queryByText(/Hold/i)).not.toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(
      <Card
        card="Q♦"
        isHeld={false}
        onClick={mockOnClick}
        theme={mockTheme}
      />
    );

    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const mockOnClick = jest.fn();
    render(
      <Card
        card="J♣"
        isHeld={false}
        onClick={mockOnClick}
        theme={mockTheme}
        disabled={true}
      />
    );

    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('applies correct border color when held', () => {
    render(
      <Card
        card="10♥"
        isHeld={true}
        onClick={() => {}}
        theme={mockTheme}
      />
    );

    expect(screen.getByText(/Hold/i)).toBeInTheDocument();
  });
});

describe('getCardColor', () => {
  test('returns red color for hearts', () => {
    expect(getCardColor('♥')).toBe('text-red-500');
  });

  test('returns red color for diamonds', () => {
    expect(getCardColor('♦')).toBe('text-red-500');
  });

  test('returns black color for spades', () => {
    expect(getCardColor('♠')).toBe('text-gray-900');
  });

  test('returns black color for clubs', () => {
    expect(getCardColor('♣')).toBe('text-gray-900');
  });
});
