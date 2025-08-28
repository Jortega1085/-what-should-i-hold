# What Should I Hold? - Video Poker Trainer

A React-based video poker training application that helps players learn optimal hold strategies for various poker variants.

## Features

- 🃏 **Realistic Playing Cards** - Red hearts/diamonds, proper card styling
- 🎯 **Optimal Play Analysis** - Smart recommendations for which cards to hold
- 📊 **Score Tracking** - Monitor your correct vs incorrect decisions
- 🎮 **Multiple Game Variants** - Support for different pay tables:
  - Jacks or Better 9/6
  - Jacks or Better 8/5  
  - Double Bonus
  - Double Double Bonus
  - Bonus Poker
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ✨ **Smooth Animations** - Powered by Framer Motion

## How to Play

1. **View Your Hand** - You start with 5 cards
2. **Select Cards to Hold** - Click on cards you want to keep (they turn green)
3. **Submit Your Decision** - Click "Submit Hold" to see if you made the optimal choice
4. **Learn from Results** - Get immediate feedback on your strategy
5. **Deal New Hand** - Click "Deal Random" for a fresh hand

## Optimal Play Logic

The trainer implements basic video poker strategy:
- **Made Hands**: Hold Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight
- **Three of a Kind**: Hold the three matching cards
- **Pairs**: Hold Jacks or Better (J, Q, K, A pairs)
- **Draws**: Hold 4-card flush draws
- **High Cards**: Keep Jacks, Queens, Kings, Aces when no pairs
- **Nothing Good**: Draw 5 new cards

## Getting Started

### Prerequisites

- Node.js (14+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/what-should-i-hold.git

# Navigate to project directory
cd what-should-i-hold

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at `http://localhost:3000`

### Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the test runner in interactive watch mode.

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Create React App** - Project setup

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by professional video poker training software
- Card game logic based on standard poker hand rankings
- UI design inspired by modern card game interfaces
