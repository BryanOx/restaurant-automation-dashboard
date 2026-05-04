# Design: message-model-toggle

## Technical Approach

Add client-side state management for view mode and sort options in the Messages page component. Use React useState hooks to manage toggle state, with localStorage for persistence. No backend changes required.

## Architecture Decisions

### Decision: State Management Location

**Choice**: Local component state in messages/page.tsx
**Alternatives considered**: Shared context, URL params, hook extraction
**Rationale**: Simple enhancement, no need for cross-component sharing, direct access to message data already in the component

### Decision: Preference Storage

**Choice**: localStorage with key prefix
**Alternatives considered**: URL query params, React Query cache
**Rationale**: Survives page refresh, simple implementation, no server dependency. localStorage preferred over URL params to avoid unnecessary history entries.

### Decision: Flat View Implementation

**Choice**: Client-side re-processing of already-fetched messages
**Alternatives considered**: New API endpoint, separate data fetch
**Rationale**: Messages already loaded via useMessages hook with pagination. Client-side re-processing is immediate and avoids extra API calls.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app\(dashboard)\messages\page.tsx` | Modify | Add toggle controls, view mode state, sort state, localStorage persistence |
| `lib\hooks\useMessages.ts` | Modify | Add optional sortBy parameter (optional enhancement) |

## Data Flow

```
User clicks toggle → useState updates → re-render with sorted/grouped messages → localStorage setItem
Page load → localStorage getItem → restore state → initial render applies saved preferences
```

## Interfaces / Contracts

```typescript
type ViewMode = 'grouped' | 'flat';
type SortMode = 'newest-first' | 'oldest-first' | 'by-contact';

interface MessagePreferences {
  viewMode: ViewMode;
  sortMode: SortMode;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Toggle state changes, sorting logic | Manual verification in browser |
| Integration | localStorage round-trip | Check persistence after refresh |
| E2E | Full toggle flow | Manual or browser automation |

Note: No test runner detected in project (from sdd-init). Manual verification required.

## Migration / Rollback

No migration required. This is a pure UI enhancement with no data changes.

## Open Questions

- [ ] Should we also add a filter by contact search? (deferred to future)
- [ ] Should flat view show pagination differently? (deferred to future)
- [ ] None - design is complete