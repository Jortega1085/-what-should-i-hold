# Development Documentation

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: 16.0+ (recommended: 18.0+)
- **npm**: 8.0+ or **yarn**: 1.22+
- **Git**: Latest stable version

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Jortega1085/-what-should-i-hold.git

# Navigate to project directory
cd -what-should-i-hold

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

## 📁 Project Structure

```
src/
├── App.tsx                 # Main application component
├── index.tsx              # React application entry point
├── index.css             # Global styles and Tailwind imports
├── components/           # Reusable UI components (future)
├── utils/               # Utility functions (future)
└── types/              # TypeScript type definitions (future)

public/
├── index.html          # HTML template
├── manifest.json       # PWA manifest
└── icons/             # App icons and favicons

build/                 # Production build output (generated)
```

## 🔧 Build & Deployment

### Development Commands
```bash
# Start development server with hot reload
npm start

# Run TypeScript type checking
npm run build

# Run tests (when implemented)
npm test

# Eject Create React App configuration (irreversible)
npm run eject
```

### Deployment Commands  
```bash
# Build optimized production bundle
npm run build

# Deploy to GitHub Pages
npm run deploy

# Preview production build locally
npx serve -s build
```

## 🧮 Core Algorithm Details

### Strategy Analysis Engine

The application evaluates all 32 possible hold combinations for each 5-card hand:

1. **Single Card Holds** (5 combinations) - Hold each individual card
2. **Two Card Holds** (10 combinations) - Hold each possible pair
3. **Three Card Holds** (10 combinations) - Hold each possible triplet
4. **Four Card Holds** (5 combinations) - Hold each possible quartet
5. **Five Card Hold** (1 combination) - Hold the entire hand
6. **Draw 5** (1 combination) - Discard all cards

### RTP Calculation Method

For each hold combination:
1. **Identify Remaining Cards** - Determine which cards will be replaced
2. **Calculate Probabilities** - For each possible completing hand
3. **Apply Pay Table** - Multiply probability by payout for each outcome
4. **Sum Expected Values** - Total all weighted outcomes for final EV

### Game-Specific Optimizations

#### Jacks or Better
- Prioritizes high card pairs and suited connectors
- Conservative approach focusing on consistent returns

#### Double Double Bonus
- Emphasizes Ace retention for bonus payouts
- Complex kicker evaluation for four-of-a-kind scenarios
- Advanced pair splitting analysis for optimal play

#### Bonus Variants
- Specialized logic for premium four-of-a-kind payouts
- Modified straight and flush valuations based on pay tables

## 🎨 Styling Architecture

### Tailwind CSS Configuration
- **Custom Color Palette** - Extended colors for themes
- **Glass Morphism Utilities** - Backdrop blur and transparency classes
- **Animation Extensions** - Custom keyframes and transitions

### Theme System
Three comprehensive themes with consistent styling:
- **Light Theme** - Professional blue gradients with slate accents
- **Dark Theme** - Elegant purple and violet color schemes  
- **Casino Theme** - Authentic green and gold casino aesthetics

### Responsive Design
- **Mobile-First Approach** - Base styles for mobile, scaled up
- **Flexible Grid Systems** - CSS Grid and Flexbox for layouts
- **Touch-Friendly Interactions** - Proper sizing for mobile interfaces

## 📊 Data Management

### Career Statistics Schema
```typescript
interface CareerStats {
  totalHands: number;
  correctDecisions: number;
  totalRTPGained: number;
  totalRTPLost: number;
  mistakesByGame: Record<string, number>;
  mistakesBySeverity: Record<string, number>;
  sessionsByDate: Record<string, SessionData>;
  bestStreak: number;
  currentStreak: number;
  startDate: string;
  lastPlayed: string;
  handsPerGame: Record<string, GameStats>;
}
```

### LocalStorage Implementation
- **Persistent Statistics** - Career data survives browser sessions
- **Game Preferences** - Theme and variant selections remembered
- **Backward Compatibility** - Graceful handling of schema updates
- **Data Validation** - Type checking and sanitization on load

## ⚡ Performance Considerations

### React Optimization
- **useMemo Hooks** - Expensive calculations cached appropriately
- **Component Memoization** - Prevent unnecessary re-renders
- **State Management** - Minimal state updates for smooth UX

### Bundle Optimization
- **Code Splitting** - Dynamic imports for large components (future)
- **Tree Shaking** - Unused code eliminated in production builds
- **Asset Optimization** - Images and fonts compressed for fast loading

## 🔒 Security & Privacy

### Data Privacy
- **Local Storage Only** - No personal data transmitted to servers
- **No Tracking** - No analytics or user behavior monitoring
- **Open Source** - Complete transparency in code and functionality

### Code Security
- **Input Validation** - All user inputs sanitized and validated
- **Type Safety** - TypeScript prevents runtime type errors
- **Dependency Auditing** - Regular security scans of npm packages

## 🧪 Testing Strategy (Future Implementation)

### Planned Testing Approach
- **Unit Tests** - Individual function and component testing
- **Integration Tests** - Strategy engine accuracy verification
- **E2E Tests** - Complete user workflow validation
- **Performance Tests** - Load testing and optimization verification

### Mathematical Verification
- **Strategy Validation** - Cross-reference with published poker mathematics
- **RTP Accuracy** - Verify calculations match industry standards
- **Edge Case Testing** - Unusual hand combinations and scenarios

## 🔄 Version Control & Releases

### Git Workflow
- **Main Branch** - Stable, production-ready code
- **Feature Branches** - Individual feature development
- **Commit Convention** - Descriptive commit messages with emojis
- **Automated Deployment** - GitHub Actions for CI/CD

### Release Process
1. **Feature Development** - Implement and test new functionality
2. **Code Review** - Quality assurance and best practices
3. **Integration Testing** - Verify compatibility with existing features
4. **Production Deployment** - Automated build and deploy to GitHub Pages
5. **Documentation Updates** - Keep README and docs current

## 📈 Monitoring & Analytics

### Performance Monitoring
- **Build Size Tracking** - Monitor bundle size over time
- **Load Time Analysis** - Optimize for fast initial page loads
- **Animation Performance** - Ensure smooth 60fps interactions

### User Experience Metrics
- **Error Tracking** - Identify and resolve runtime issues
- **Feature Usage** - Understand which features provide most value
- **Accessibility Compliance** - Regular audits for inclusive design

---

*This documentation is maintained by Joe Ortega and updated with each major release.*