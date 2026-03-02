# DiabetesCare Patient Mobile App — React Native + Expo

## Overview

This is the **Patient Mobile App** for the DiabetesCare collaborative platform. It's built with **React Native** and **Expo SDK 54**, allowing patients with Type 2 Diabetes to:

- View AI-generated meal plans
- Chat with an AI nutrition assistant
- Track their nutrition and health journey
- Receive guidance from their healthcare providers

## Tech Stack

- **React Native** with **Expo SDK 54**
- **TypeScript** for type safety
- **React Navigation** (to be configured)
- **React Context** + Custom Hooks for state management
- **Async Storage** for secure token storage
- **Native Stylesheet** for styling (clean, lightweight)

## Project Structure

```
app/
├── components/
│   ├── atoms/            # Base UI components (Button, Input, Badge, Card, Skeleton)
│   ├── molecules/        # Composite components (MealCard, MessageBubble, FilterChip)
│   └── organisms/        # Complex UI units (MealPlanList, ChatWindow, etc.)
├── screens/
│   ├── auth/             # LoginScreen, ForgotPasswordScreen
│   ├── dashboard/        # MealPlanDashboard
│   └── chat/             # AIChatScreen
├── context/              # React Context (Auth, MealPlan, Chat)
├── hooks/                # Custom hooks (useAuth, useMealPlan, useChat)
├── services/             # API service layer (authService, mealService, chatService)
├── types/                # TypeScript interfaces
├── constants/            # Theme, colors, spacing, typography
├── utils/                # Helper functions (validation, formatting, etc.)
├── mocks/                # Mock data for development
├── navigation/           # Navigation structure (AppNavigator, AuthNavigator)
└── _layout.jsx          # Root layout with context providers
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Run the App

**Start Expo:**

```bash
npx expo start
```

**Run on different platforms:**

- **Web Browser:** Press `w`
- **Expo Go (Mobile):** Scan the QR code with your phone's camera
- **Android Emulator:** Press `a`
- **iOS Simulator:** Press `i` (requires Xcode on macOS)

## Key Files & Components

### Screens

- **LoginScreen** (`/screens/auth/LoginScreen.tsx`)
  - Email/password authentication
  - User type selection (Patient/Doctor)
  - Validation and error handling
  - Demo credentials: `patient@example.com` / `password`

- **MealPlanDashboard** (`/screens/dashboard/MealPlanDashboard.tsx`) - _In Progress_
  - Display today's AI-recommended meal plan
  - Filter by cuisine and budget
  - Regenerate meals with custom preferences
  - Doctor's intervention notes

- **AIChatScreen** (`/screens/chat/AIChatScreen.tsx`) - _In Progress_
  - Real-time chat with AI nutrition assistant
  - Streaming responses
  - Suggested prompts
  - Chat history

### Services

All API calls are abstracted into service layer:

**authService.ts**

```typescript
authService.login(credentials);
authService.register(data);
authService.logout();
authService.refreshToken(token);
authService.getCurrentUser();
authService.updateProfile(updates);
```

**mealService.ts**

```typescript
mealService.getTodaysMealPlan();
mealService.getMealPlan(date);
mealService.regeneratePlan(preferences);
mealService.updateMealPreferences(preferences);
mealService.rateMeal(mealId, rating);
mealService.saveMeal(mealId);
```

**chatService.ts**

```typescript
chatService.sendMessage(message);
chatService.streamMessage(message); // For streaming responses
chatService.getChatHistory();
chatService.clearChatHistory();
chatService.getSuggestedPrompts();
```

### Context & Hooks

Use these custom hooks in components:

```typescript
import { useAuth, useMealPlan, useChat } from "@/hooks";

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { todaysPlan, regeneratePlan, preferences } = useMealPlan();
  const { messages, sendMessage, isStreaming } = useChat();
};
```

### UI Components

**Atoms** (Basic building blocks):

- `Button` — With variants (primary, secondary, outline), sizes, loading states
- `TextInput` — With label, error display, focus states
- `Badge` — Status indicators with color variants
- `Card` — Reusable card with shadow options
- `Skeleton` — Loading placeholder with animation

**Molecules** (Composite components):

- `MealCard` — Displays meal with nutrition info
- `MessageBubble` — Chat message with timestamp
- `FilterChipGroup` — Selectable filter chips

### Styling

All colors, spacing, and typography defined in `/constants/theme.ts`:

```typescript
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme'

// Usage
<View style={{ backgroundColor: Colors.primary, padding: Spacing.lg }}>
  <Text style={{ fontSize: Typography.sizes.h2, fontWeight: Typography.weights.bold }}>
    Title
  </Text>
</View>
```

## Authentication Flow

1. User enters email and password on **LoginScreen**
2. `authService.login()` is called
3. On success, JWT token and user data are stored
4. `AuthContext` updates globally
5. Navigation guards redirect to dashboard
6. On logout, token is cleared and user returns to login

Routes:

- **Unauthenticated:** LoginScreen → ForgotPasswordScreen
- **Authenticated:** Dashboard → MealPlanDashboard, AIChatScreen

## Development Mode

### Mock Data

By default, the app uses **mock data** for development. This allows UI development without a backend.

To toggle mock mode, edit service files:

```typescript
const USE_MOCK = true; // Set to false when backend is ready
```

Mock data includes:

- Sample user profile
- Sample meal plans with nutrition data
- Sample chat messages and AI responses

## Next Steps

- [ ] Complete MealPlanDashboard screen
- [ ] Complete AIChatScreen with streaming
- [ ] Set up React Navigation (Bottom Tab + Stack navigators)
- [ ] Configure root \_layout.jsx with providers
- [ ] Implement AsyncStorage for token persistence
- [ ] Add error handling & logging
- [ ] Build Clinician Web Dashboard (separate React app)
- [ ] API integration with FastAPI backend
- [ ] Testing & QA

## Contributing

Follow these principles:

- **Separation of Concerns:** Keep logic out of components
- **Type Safety:** Use TypeScript everywhere
- **Custom Hooks:** Extract reusable logic into hooks
- **Component Composition:** Build with atoms → molecules → organisms
- **Error Handling:** Every async operation must handle errors gracefully

## Troubleshooting

### Port 8081 in use

```bash
# Find and kill the process
netstat -ano | findstr :8081
taskkill /PID <PID> /F
# Or use a different port
npx expo start --tunnel
```

### Dependency issues

```bash
npm install --legacy-peer-deps
# Or
npm install --force
```

### AsyncStorage not available

Make sure `expo-securestore` or `@react-native-async-storage/async-storage` is installed:

```bash
npx expo install @react-native-async-storage/async-storage
```

## Support

See individual component files for detailed JSDoc comments and usage examples.
