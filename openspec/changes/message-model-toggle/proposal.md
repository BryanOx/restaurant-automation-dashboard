# Proposal: message-model-toggle

## Intent

Add view toggles and sorting options to the Messages page so users can switch between conversation grouped view and flat chronological view, and sort messages by date.

## Scope

### In Scope
- Add view mode toggle (Grouped by conversation / Flat list)
- Add sort options (Newest first / Oldest first / By contact)
- Update messages page UI with toggle controls
- Persist user preferences in localStorage

### Out of Scope
- Backend API changes (keep client-side only)
- Multiple message filter options (future work)
- Real-time message updates

## Capabilities

### New Capabilities
- `message-view-toggle`: Toggle between grouped conversations and flat message list
- `message-sort-options`: Sort messages by date (ascending/descending) or by contact name

### Modified Capabilities
- None (pure UI enhancement, no spec-level changes)

## Approach

Add React state in the Messages page component:
1. View mode state: `grouped` (default, current behavior) | `flat`
2. Sort mode state: `newest-first` | `oldest-first` | `by-contact`
3. Toggle buttons in the page header
4. Persist preferences to localStorage

Use client-side processing since messages are already loaded. The grouping/sorting logic exists in the page component and can be extended.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app\(dashboard)\messages\page.tsx` | Modified | Add toggle controls and sort options |
| `lib\hooks\useMessages.ts` | Modified | Add sortBy state to hook options |
| `lib\session\components.tsx` | Reference | May reuse existing Button components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| LocalStorage unavailable | Low | Fallback to in-memory state |
| Large message datasets slow | Low | Use pagination with messages, limit group display |

## Rollback Plan

1. Remove toggle state and UI components from messages/page.tsx
2. Remove localStorage read/write calls
3. Revert to current grouped-only view

## Dependencies

- None (client-side only)

## Success Criteria

- [ ] User can toggle between grouped and flat message views
- [ ] User can sort messages by newest, oldest, or by contact
- [ ] Preferences persist across page refreshes (localStorage)
- [ ] No breaking changes to existing messages functionality