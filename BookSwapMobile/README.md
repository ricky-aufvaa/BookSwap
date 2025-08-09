# BookSwap Mobile App

A beautiful, light-themed React Native application for sharing books within your community. Built with Expo and inspired by Notion's elegant design.

## Features

- **Authentication**: Secure login and signup with JWT tokens
- **Book Management**: Add, view, and manage your personal book collection
- **Book Search**: Search for books using Google Books API with local availability indicators
- **Community Features**: Find other users in your city who own specific books
- **Beautiful UI**: Light theme with elegant animations and smooth transitions
- **Responsive Design**: Optimized for both iOS and Android devices

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Axios** for API calls
- **AsyncStorage** for local data persistence
- **React Native Animatable** for smooth animations
- **Expo Vector Icons** for beautiful icons
- **React Native Gesture Handler** for smooth interactions

## Design System

The app follows a consistent design system inspired by Notion:

- **Colors**: Light theme with carefully chosen color palette
- **Typography**: Consistent text styles and hierarchy
- **Spacing**: Systematic spacing using a base unit system
- **Components**: Reusable, well-designed components
- **Animations**: Subtle and meaningful animations throughout

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── BookCard.tsx
│   └── index.ts
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── MyBooksScreen.tsx
│   └── ProfileScreen.tsx
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── TabNavigator.tsx
├── services/          # API and external services
│   └── api.ts
├── constants/         # Design system constants
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── types/            # TypeScript type definitions
│   └── index.ts
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd BookSwapMobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the API base URL in `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://your-backend-url:8000/api/v1';
   ```

### Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Use the Expo Go app on your phone to scan the QR code, or:
   - Press `i` to open iOS Simulator
   - Press `a` to open Android Emulator
   - Press `w` to open in web browser

### Building for Production

1. For iOS:
   ```bash
   npm run ios
   ```

2. For Android:
   ```bash
   npm run android
   ```

3. For web:
   ```bash
   npm run web
   ```

## Key Components

### Button Component
- Multiple variants (primary, secondary, outline, ghost)
- Different sizes (small, medium, large)
- Loading states and icons
- Smooth animations

### Input Component
- Form validation support
- Password visibility toggle
- Left and right icons
- Focus states and animations

### Card Component
- Consistent elevation and shadows
- Pressable variants
- Smooth animations

### BookCard Component
- Displays book information elegantly
- Shows availability status
- Rating display
- Owner information

## API Integration

The app integrates with the BookSwap backend API:

- **Authentication**: Login, signup, logout, token validation
- **Books**: Add books, get user's books, search books
- **Users**: Get book owners, user profiles

## Design Principles

1. **Consistency**: Uniform spacing, colors, and typography
2. **Accessibility**: Proper contrast ratios and touch targets
3. **Performance**: Optimized animations and efficient rendering
4. **User Experience**: Intuitive navigation and clear feedback
5. **Visual Hierarchy**: Clear information architecture

## Contributing

1. Follow the existing code style and structure
2. Use TypeScript for all new code
3. Follow the design system constants
4. Add proper error handling
5. Test on both iOS and Android

## License

This project is part of the BookSwap application suite.
