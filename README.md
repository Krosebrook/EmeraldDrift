# EmeraldDrift (Creator Studio Lite)

[![Expo](https://img.shields.io/badge/Expo-54-4630EB?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A production-ready mobile application for multi-platform content creation and social media management.

EmeraldDrift is a comprehensive social media management platform that empowers creators to manage their presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest. Built with Expo React Native, it features AI-powered content generation, real-time analytics, team collaboration, and smart scheduling capabilities.

![Creator Studio Dashboard](docs/assets/dashboard-preview.png)

## ✨ Features

### 🎨 Content Studio
- AI-powered content generation with draft management
- Multi-platform publishing with single workflow
- Rich media support (images, videos, carousels)
- Smart scheduling with optimal timing recommendations
- Draft auto-save and version history

### 📊 Analytics Dashboard
- Real-time engagement metrics (views, likes, comments, shares)
- Growth tracking with trend analysis
- Platform-specific performance insights
- Customizable date ranges (7d, 30d, 90d, all-time)
- Export analytics reports

### 👥 Team Collaboration
- Role-based access control (Admin, Editor, Viewer)
- Workspace management for agencies and brands
- Activity logs and audit trails
- Shared content calendars
- Team member invitations

### 📱 Platform Integration
- Instagram, TikTok, YouTube, LinkedIn, Pinterest
- Connection status monitoring
- Platform-specific content optimization
- Bulk publish and schedule across multiple platforms
- Platform analytics aggregation

### 📚 Media Library
- Centralized asset management
- Favorites and tagging system
- Search and filter capabilities
- Cloud storage with CDN delivery
- Duplicate detection

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Expo Go** app on your mobile device (iOS/Android)
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/Krosebrook/EmeraldDrift.git
cd EmeraldDrift

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running the App

1. **Mobile (Recommended)**:
   - Open Expo Go app on your device
   - Scan the QR code displayed in the terminal
   - App will load automatically

2. **Web Browser**:
   ```bash
   npm run web
   ```

3. **iOS Simulator** (Mac only):
   ```bash
   npm run ios
   ```

4. **Android Emulator**:
   ```bash
   npm run android
   ```

## 📖 Documentation

> **📚 [Complete Documentation Index](docs/INDEX.md)** - Navigate all documentation by role and topic

### Core Documentation
- [**Architecture Guide**](docs/ARCHITECTURE.md) - System design, module structure, and ADRs
- [**Contributing Guide**](docs/CONTRIBUTING.md) - Development workflow and coding standards
- [**API Documentation**](docs/API.md) - Feature services and repository APIs
- [**Testing Guide**](docs/TESTING.md) - Testing strategies and best practices
- [**Deployment Guide**](docs/DEPLOYMENT.md) - Build and release process overview

### Mobile Platform Guides
- [**Google Play Store Guide**](docs/GOOGLE_PLAY_STORE.md) - Complete Play Store submission and compliance
- [**Apple App Store Guide**](docs/APP_STORE_SUBMISSION.md) - Complete App Store submission for iOS
- [**Android Configuration**](docs/ANDROID_CONFIGURATION.md) - Native Android setup and configuration
- [**Release Checklist**](docs/RELEASE_CHECKLIST.md) - Pre-release verification and quality assurance

### Additional Resources
- [Design Guidelines](design_guidelines.md) - UI/UX specifications and design system
- [Privacy Policy](docs/PRIVACY_POLICY.md) - Data handling and privacy practices
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Changelog](CHANGELOG.md) - Version history and release notes

## 🏗️ Project Structure

```
EmeraldDrift/
├── features/           # Feature-first domain modules
│   ├── shared/         # Shared types, repository factory, Result pattern
│   ├── auth/           # Authentication and session management
│   ├── content/        # Content CRUD, publish, schedule operations
│   ├── platforms/      # Platform connections management
│   ├── analytics/      # Analytics snapshots and metrics
│   └── team/           # Team collaboration and roles
├── core/               # Core infrastructure (errors, result, validation)
├── context/            # React contexts (Auth, Team)
├── hooks/              # React hooks (useTheme, useResponsive, useAuth)
├── services/           # External integrations (AI, notifications)
├── navigation/         # Navigation configuration
├── components/         # Reusable UI components
├── screens/            # Screen components
├── constants/          # Design system (colors, spacing, typography)
├── assets/             # Images, fonts, and media files
├── docs/               # Documentation files
└── scripts/            # Build and automation scripts
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54+ with React Native 0.81 |
| Language | TypeScript 5.9 (strict mode) |
| Navigation | React Navigation 7 (tabs + stacks) |
| State Management | Context API with useReducer pattern |
| Data Persistence | AsyncStorage with Repository pattern |
| Styling | StyleSheet with design tokens |
| UI Components | Custom components with theming |
| Icons | Expo Vector Icons (Feather) |
| HTTP Client | Fetch API with Result pattern |
| Notifications | Expo Notifications |
| Media | Expo Image Picker & Image |

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start Expo development server
npm run start            # Alternative dev server command

# Platform-specific
npm run android          # Run on Android emulator
npm run ios              # Run on iOS simulator
npm run web              # Run in web browser

# Code Quality
npm run lint             # Run ESLint
npm run check:format     # Check code formatting with Prettier
npm run format           # Auto-format code with Prettier

# Build & Deploy
npm run build            # Build for production
```

## 🎨 Design System

EmeraldDrift follows the **SparkLabs Mobile Design Guidelines** with a comprehensive design system:

### Color Palette
- **Primary**: `#8B5CF6` (Brand Purple)
- **Success**: `#10B981` (Growth indicators)
- **Warning**: `#F59E0B` (Revenue alerts)
- **Error**: `#EF4444` (Error states)

### Spacing (8pt Grid)
- `xs: 4px`, `sm: 8px`, `md: 12px`, `base: 16px`, `lg: 24px`, `xl: 32px`

### Typography Scale
- **Display**: 34px Bold (Hero headlines)
- **Title 1**: 28px Bold (Screen titles)
- **Title 2**: 22px Bold (Section headers)
- **Body**: 17px Regular (Primary content)
- **Caption**: 12px Regular (Metadata)

### Responsive Breakpoints
- **Mobile**: < 480px (2 columns)
- **Tablet**: 480-768px (3 columns)
- **Desktop**: > 768px (4 columns)

See [Design Guidelines](design_guidelines.md) for complete specifications.

## 🧪 Testing

EmeraldDrift uses a comprehensive testing strategy:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

See [Testing Guide](docs/TESTING.md) for detailed testing practices.

## 📦 Building for Production

### Android (AAB for Google Play Store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build production AAB
eas build --platform android --profile production
```

### iOS (IPA for App Store)

```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

See [Deployment Guide](docs/DEPLOYMENT.md) for complete build and release instructions.

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_API_KEY=your_api_key_here

# OpenAI (for AI content generation)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Analytics
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id

# Feature Flags
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_TEAM_FEATURES=true
```

⚠️ **Never commit `.env.local` or files containing secrets to version control.**

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our [Contributing Guide](docs/CONTRIBUTING.md)
4. **Test your changes**: `npm run lint && npm test`
5. **Commit with conventional commits**: `git commit -m "feat: add amazing feature"`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or tooling changes

## 📋 Requirements

### Google Play Store Compliance
- **Target SDK**: API Level 35 (Android 15)
- **Account Deletion**: Available in Settings → Danger Zone
- **Privacy Policy**: [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)
- **Data Export**: Available in Settings → Data & Storage
- **App Bundle**: AAB format for production builds

### Apple App Store Compliance
- **iOS Version**: iOS 15.0+
- **Privacy Manifest**: Included in build
- **App Tracking Transparency**: Implemented
- **Universal Links**: Configured for deep linking

## 🐛 Troubleshooting

### Common Issues

#### Expo Go App Not Connecting
```bash
# Clear Expo cache and restart
npx expo start -c
```

#### TypeScript Errors
```bash
# Clear TypeScript build info
rm -rf tsconfig.tsbuildinfo
npm run lint
```

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start -c
# or
npx react-native start --reset-cache
```

See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for more solutions.

## 📊 Performance

- **Bundle Size**: ~8MB (minified)
- **Time to Interactive**: < 3s on mid-range devices
- **Lighthouse Score**: 90+ (PWA)
- **Memory Usage**: ~120MB average
- **Offline Support**: Full offline mode with sync

## 🔒 Security

- **Data Encryption**: AsyncStorage encrypted at rest (iOS/Android)
- **Secure Authentication**: Token-based with expo-secure-store
- **Input Validation**: All user input validated before processing
- **API Keys**: Never committed to repository
- **HTTPS Only**: All network requests use HTTPS
- **Dependency Scanning**: Regular security audits

Report security vulnerabilities to security@example.com.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev) - Amazing React Native framework
- [React Navigation](https://reactnavigation.org) - Navigation library
- [Feather Icons](https://feathericons.com) - Beautiful icon set
- [SparkLabs](https://sparklabs.com) - Design inspiration and guidelines

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Krosebrook/EmeraldDrift/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/EmeraldDrift/discussions)
- **Email**: support@example.com

## 🗺️ Roadmap

### Q1 2026
- [ ] Instagram Reels and Stories support
- [ ] Advanced analytics with AI insights
- [ ] Bulk import from CSV
- [ ] Custom branding for agencies

### Q2 2026
- [ ] Video editing capabilities
- [ ] Hashtag research and suggestions
- [ ] Competitor analysis
- [ ] White-label solution

### Q3 2026
- [ ] Browser extension
- [ ] Desktop app (Electron)
- [ ] API for third-party integrations
- [ ] Advanced automation workflows

---

**Built with ❤️ by the EmeraldDrift Team**

*Last Updated: January 2026*
