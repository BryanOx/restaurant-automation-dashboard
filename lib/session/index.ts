// ============================================
// SESSION MODULE - Export all session-related code
// ============================================

// Types and state machine
export * from './types';

// Session engine (React Query hooks)
export * from './sessionEngine';

// Session context
export { SessionProvider, useSession } from './SessionContext';

// UI Components
export { SessionStatus, QRCodePanel, ConnectionManager } from './components';