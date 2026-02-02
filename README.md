# New App

A modern cross-platform mobile application built on Draftbit with React Native, Expo, and TypeScript.

## Tech Stack

- **React Native 0.79.6** - Cross-platform mobile framework
- **Expo 53** - Development platform and tooling
- **Expo Router 5** - File-based navigation
- **TypeScript 5.8** - Type-safe development
- **NativeWind 4** - Tailwind CSS for React Native
- **React Native Reusables** - UI component library (shadcn/ui)
- **Lucide Icons** - Icon system with NativeWind support
- **Zustand** - State management

## Quick Start

```bash
yarn install    # Install dependencies
yarn start      # Start dev server
yarn ios        # Run on iOS simulator
yarn android    # Run on Android emulator
yarn web        # Run in web browser
```

## Project Structure

```
app/                    # File-based routes (Expo Router)
├── _layout.tsx         # Root layout
├── index.tsx           # Home screen
└── +not-found.tsx      # 404 page

components/
├── ui/                 # React Native Reusables components
└── ThemeToggle.tsx     # Theme switcher

lib/
├── icons/              # Lucide icon setup
├── keyboard.tsx        # Keyboard utilities
└── utils.ts            # Helper functions (cn, etc.)

assets/images/          # App icons and images
```

## Key Patterns

**Styling with NativeWind**

```typescript
// Use Tailwind classes directly
<View className="flex-1 items-center justify-center p-4">
  <Text className="text-xl font-bold text-foreground">Hello</Text>
</View>

// Conditional styles with cn utility
import { cn } from '~/lib/utils';
<View className={cn('bg-card', isActive && 'bg-primary')} />
```

**Icons**

```typescript
import { Sun } from 'lucide-react-native';
<Sun className="h-6 w-6 text-foreground" />
```

**Routing**

```typescript
import { Link, router } from 'expo-router';
<Link href="/profile">Profile</Link>
router.push('/settings');
```

**Theming**

```typescript
// Use theme classes in NativeWind
<View className="bg-background">
  <Text className="text-foreground">Themed content</Text>
</View>

// Toggle theme with built-in component
import { ThemeToggle } from '~/components/ThemeToggle';
<ThemeToggle />
```

**UI Components**

```typescript
// React Native Reusables components
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { H1, P } from '~/components/ui/typography';

<Button variant="outline"><Text>Click me</Text></Button>
<H1>Main Heading</H1>
```

## Features

- Cross-platform (iOS, Android, Web)
- Dark/Light mode theming
- UI component library (React Native Reusables)
- Type-safe development with TypeScript
- File-based routing
- Responsive and accessible

## Available Components

**UI Components**: Accordion, Alert Dialog, Avatar, Badge, Button, Card, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Input, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Select, Separator, Skeleton, Switch, Table, Tabs, Textarea, Toggle, Tooltip

**Typography**: H1, H2, H3, H4, P, Lead, Large, Small, Muted, Code, BlockQuote

## Development

```bash
yarn lint       # Run ESLint
yarn format     # Format code
yarn typecheck  # Type check
yarn prebuild   # Generate native code
yarn doctor     # Run Expo doctor
```

## Dependencies

### Core

- React 19.0.0
- React Native 0.79.6
- Expo \~53.0.25
- Expo Router \~5.1.10
- TypeScript \~5.8.3

### UI & Styling

- NativeWind \~4.1.23
- Tailwind CSS ^3.4.0
- Lucide React Native ^0.562.0
- React Native Reusables (@rn-primitives)
- Class Variance Authority ^0.7.1
- Tailwind Merge ^3.3.1
- CLSX ^2.1.1

### State & Navigation

- Zustand ^5.0.10
- @react-navigation/native ^7.0.3
- @react-navigation/bottom-tabs ^7.2.0
- @react-navigation/drawer ^7.1.1

### Utilities

- Expo Navigation Bar \~4.2.8
- Expo Splash Screen \~0.30.10
- Expo Font \~13.3.2
- @expo-google-fonts/inter ^0.4.1

### Dev Tools

- ESLint ^8.57.0
- Prettier ^3.2.5
- TypeScript ESLint ^8.33.1

---

Built with Draftbit, Expo, and React Native

---

Built with ❤️ using Draftbit, Expo, and React Native
