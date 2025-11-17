# Keyboard Shortcuts Implementation

This document describes the keyboard shortcuts feature implementation for the ticket system.

## Overview

The keyboard shortcuts system provides a flexible, extensible way to add keyboard shortcuts throughout the application. It includes:

1. **Global keyboard event handler** - Captures keyboard events and routes them to registered shortcuts
2. **Shortcut registry** - Manages all registered shortcuts with conflict prevention
3. **Context provider** - Manages global state for keyboard-triggered actions
4. **Help dialog** - Displays all available shortcuts grouped by category

## Architecture

### Core Components

#### 1. `useKeyboardShortcuts` Hook
Located in `lib/hooks/use-keyboard-shortcuts.ts`

This hook provides the core functionality:
- **ShortcutRegistry**: Manages shortcut registration and lookup
- **useKeyboardShortcuts**: Hook to register shortcuts in components
- **useGlobalKeyboardHandler**: Global event listener that processes keyboard events
- **formatShortcutKey**: Utility to format shortcuts for display

#### 2. `KeyboardShortcutsProvider` Context
Located in `lib/contexts/keyboard-shortcuts-context.tsx`

Provides global state management for:
- New ticket dialog state
- Search input reference and focus control
- Priority filter reference
- Help dialog state

#### 3. `KeyboardShortcutsHelp` Component
Located in `components/keyboard-shortcuts-help.tsx`

Displays all registered shortcuts in a categorized, user-friendly dialog.

## Available Shortcuts

### Global Shortcuts
- **N** - Open new ticket dialog
- **?** (Shift + /) - Show keyboard shortcuts help

### Navigation
- **/** - Focus search input

### Filters
- **1** - Filter by Low priority
- **2** - Filter by Medium priority
- **3** - Filter by High priority
- **4** - Filter by Urgent priority
- **5** - Clear priority filter

### Dialog Control
- **Escape** - Close dialogs (built into Radix UI Dialog component)

## Usage

### Registering Shortcuts in a Component

```tsx
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

function MyComponent() {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      description: 'Save changes',
      category: 'Actions',
      handler: () => {
        // Handle save
      },
    },
  ]);

  return <div>My Component</div>;
}
```

### Accessing Context State

```tsx
import { useKeyboardShortcutsContext } from '@/lib/contexts/keyboard-shortcuts-context';

function MyComponent() {
  const { isNewTicketDialogOpen, setIsNewTicketDialogOpen } = useKeyboardShortcutsContext();

  return (
    <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
      {/* Dialog content */}
    </Dialog>
  );
}
```

### Registering Search Input

```tsx
import { useKeyboardShortcutsContext } from '@/lib/contexts/keyboard-shortcuts-context';
import { useRef, useEffect } from 'react';

function SearchComponent() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { registerSearchInput } = useKeyboardShortcutsContext();

  useEffect(() => {
    if (searchInputRef.current) {
      registerSearchInput(searchInputRef);
    }
  }, [registerSearchInput]);

  return <Input ref={searchInputRef} />;
}
```

## Shortcut Configuration

### KeyboardShortcut Interface

```typescript
interface KeyboardShortcut {
  key: string;              // The key to press (e.g., 'n', '/', 'Escape')
  ctrl?: boolean;           // Require Ctrl key (Windows/Linux)
  meta?: boolean;           // Require Cmd key (Mac) or Win key (Windows)
  shift?: boolean;          // Require Shift key
  alt?: boolean;            // Require Alt key
  description: string;      // Description shown in help dialog
  category?: string;        // Category for grouping in help dialog
  handler: (event: KeyboardEvent) => void;  // Function to execute
  preventDefault?: boolean; // Prevent default browser behavior (default: true)
}
```

## Input Field Handling

The system automatically prevents shortcuts from triggering when typing in input fields, with two exceptions:

1. **/** (slash) - Always works to focus search
2. **Escape** - Always works to close dialogs

This prevents conflicts with normal typing while maintaining essential navigation shortcuts.

## Browser Compatibility

The system uses standard keyboard events and works across all modern browsers:
- Chrome/Edge
- Firefox
- Safari

Platform-specific modifiers are handled automatically:
- **Ctrl** on Windows/Linux
- **Cmd (⌘)** on macOS

## Extending the System

### Adding New Shortcuts

1. Register shortcuts in the component where they're relevant:

```tsx
useKeyboardShortcuts([
  {
    key: 'e',
    description: 'Edit ticket',
    category: 'Tickets',
    handler: () => {
      // Handle edit
    },
  },
]);
```

2. If the shortcut needs to control global state, add it to the context:

```tsx
// In keyboard-shortcuts-context.tsx
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

// In component
const { isEditDialogOpen, setIsEditDialogOpen } = useKeyboardShortcutsContext();
```

### Adding New Categories

Categories are automatically created based on the `category` field in shortcuts. Common categories:

- **General** - Application-wide shortcuts
- **Navigation** - Navigation and focus shortcuts
- **Tickets** - Ticket-specific actions
- **Filters** - Filter controls
- **Actions** - Action buttons

## Testing

To test keyboard shortcuts:

1. Open the application
2. Press **?** to view all available shortcuts
3. Try each shortcut to verify it works
4. Test in different contexts (with/without input focus)
5. Test on different platforms (Windows, Mac, Linux)

## Accessibility

The keyboard shortcuts system enhances accessibility by:

1. Providing keyboard-only navigation
2. Displaying visual indicators for shortcuts (in help dialog)
3. Using semantic HTML for keyboard key display
4. Supporting screen readers with proper ARIA labels
5. Following WCAG 2.1 guidelines

## Performance

The system is optimized for performance:

1. **Single global event listener** - Only one keydown listener for the entire app
2. **Efficient lookup** - O(1) shortcut lookup using Map
3. **Memoized callbacks** - Prevents unnecessary re-renders
4. **Automatic cleanup** - Shortcuts are unregistered when components unmount

## Future Enhancements

Potential improvements:

1. **Customizable shortcuts** - Allow users to customize key bindings
2. **Shortcut conflicts detection** - Warn when shortcuts conflict
3. **Shortcut recording** - UI to record custom shortcuts
4. **Shortcut profiles** - Different shortcut sets for different roles
5. **Shortcut analytics** - Track which shortcuts are most used

## Requirements Satisfied

This implementation satisfies the following requirements:

- **27.1** - Keyboard shortcut 'N' to create a new ticket
- **27.2** - Keyboard shortcut '/' to focus the search input
- **27.3** - Keyboard shortcuts '1-5' to filter by priority
- **27.4** - 'Escape' key to close dialogs and modals
- **27.5** - Keyboard shortcuts help dialog accessible via '?' key
