# Delta for message-view-toggle

## ADDED Requirements

### Requirement: View Mode Toggle

The messages page MUST provide a toggle control allowing users to switch between two view modes: "grouped" (default, grouped by conversation) and "flat" (all messages in chronological list).

- GIVEN the user is on the messages page
- WHEN the user clicks the view mode toggle
- THEN the display MUST switch to the selected mode:
  - "grouped": Messages displayed in conversation groups, expandable to show individual messages
  - "flat": All messages displayed in a single chronological list, newest first by default
- AND the toggle MUST show the currently selected mode

### Requirement: Sort Options

The messages page MUST provide sort options allowing users to order messages by:
- "newest-first": Most recent message at top (default)
- "oldest-first": Oldest message at top
- "by-contact": Alphabetically by contact phone/name

- GIVEN the user is on the messages page
- WHEN the user selects a sort option
- THEN the messages MUST be re-sorted according to the selected order
- AND the selection SHOULD persist until changed by the user

### Requirement: Preference Persistence

User view mode and sort preferences MUST be persisted in localStorage and restored on page load.

- GIVEN the user has previously selected view mode or sort options
- WHEN the user returns to the messages page
- THEN the page MUST restore the saved preferences
- AND display messages according to the restored settings

- GIVEN localStorage is unavailable or corrupted
- WHEN the messages page loads
- THEN the page MUST use default values (grouped view, newest-first sort)

## REMOVED Requirements

None.

## MODIFIED Requirements

None.