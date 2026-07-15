# Tasks: message-model-toggle

## Phase 1: Types and Constants

- [x] 1.1 Define ViewMode and SortMode types in `lib/types/index.ts`
- [x] 1.2 Create localStorage key constants in the messages page

## Phase 2: State Management

- [x] 2.1 Add viewMode state with useState hook in MessagesPage component
- [x] 2.2 Add sortMode state with useState hook in MessagesPage component
- [x] 2.3 Implement localStorage load on component mount
- [x] 2.4 Implement localStorage save on state change

## Phase 3: Sorting Logic

- [x] 3.1 Implement sorting functions: newest-first, oldest-first, by-contact
- [x] 3.2 Apply sortMode to message array before rendering
- [x] 3.3 Handle empty state for sorting

## Phase 4: View Toggle UI

- [x] 4.1 Add toggle button group in page header (grouped/flat)
- [x] 4.2 Add sort dropdown/buttons in page header (newest/oldest/contact)
- [x] 4.3 Implement flat view rendering (all messages in list)
- [x] 4.4 Implement grouped view rendering (existing behavior)
- [x] 4.5 Style toggle buttons consistently with dashboard design

## Phase 5: Integration Testing

- [ ] 5.1 Test view mode toggle in browser
- [ ] 5.2 Test sort options in browser
- [ ] 5.3 Verify localStorage persistence after page refresh
- [ ] 5.4 Test localStorage unavailable fallback (simulate)

## Phase 6: Cleanup

- [x] 6.1 Remove console.log statements if any added
- [x] 6.2 Review code for any edge cases