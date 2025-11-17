export { usePermissions } from './use-permissions';
export type { UsePermissionsReturn, Ticket } from './use-permissions';

// Ticket data fetching hooks
export { useTickets } from './use-tickets';
export { useTicket } from './use-ticket';
export { useTicketMutations } from './use-ticket-mutations';

// Real-time update tracking hooks
export { useTicketUpdates } from './use-ticket-updates';
export { useTicketDetailUpdates } from './use-ticket-detail-updates';

// Knowledge Base hooks
export { useKBArticles } from './use-kb-articles';
export { useKBArticle } from './use-kb-article';
export { useKBCategories } from './use-kb-categories';
export { useKBSearch } from './use-kb-search';
export { useKBSuggestions } from './use-kb-suggestions';

// Keyboard shortcuts hooks
export { 
  useKeyboardShortcuts, 
  useShortcutRegistry, 
  useGlobalKeyboardHandler,
  formatShortcutKey 
} from './use-keyboard-shortcuts';
export type { KeyboardShortcut } from './use-keyboard-shortcuts';

// Undo functionality hook
export { useUndo } from './use-undo';
export type { UndoAction } from './use-undo';
