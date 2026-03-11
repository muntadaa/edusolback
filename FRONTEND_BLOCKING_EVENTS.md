# Frontend: Blocking events (grey out days in calendar & planning)

**Create events first** via the Events CRUD – see **[FRONTEND_EVENTS_CRUD.md](./FRONTEND_EVENTS_CRUD.md)** for list/create/update/delete.

Blocking events are periods (e.g. holidays, exams, closures) during which **no planning session** can be created. The backend already rejects creating/updating a session when the date falls inside a blocking event. The frontend should **grey out** these days so users cannot select them when adding a planning or when viewing the calendar.

## Endpoint

**`GET /api/events/blocking`** (JWT required)

Returns all events where `is_blocking = true`. Use the response to compute which calendar days are blocked and style them (e.g. grey, disabled).

### Query parameters (optional)

| Param | Type   | Description |
|-------|--------|-------------|
| `from` | string | Start of range (YYYY-MM-DD). Only events that overlap `[from, to]` are returned. |
| `to`   | string | End of range (YYYY-MM-DD). Use with `from` for the visible calendar window. |

- Without `from`/`to`: returns all blocking events.
- With `from` and `to`: returns only blocking events that overlap that range (e.g. for the current month or visible calendar range).

### Response (array of events)

Each item:

```json
{
  "id": 1,
  "title": "Winter break",
  "description": null,
  "start_date": "2025-12-20",
  "end_date": "2025-12-31",
  "type": "holiday",
  "is_blocking": true,
  "created_at": "...",
  "updated_at": "..."
}
```

You only need `start_date`, `end_date`, and optionally `title`/`type` for tooltips or labels.

## How to use on the frontend

### 1. When adding a planning (date picker)

- Call `GET /api/events/blocking` (optionally with `from`/`to` for the picker’s min/max range).
- Build a set of **blocked dates**: for each event, add every date between `start_date` and `end_date` (inclusive) to a list or set.
- In the date picker:
  - **Disable** every date that is in this set (greyed out, not selectable).
  - Optionally show a tooltip like “Blocked: Winter break” on hover.

Example (JavaScript): a date is blocked if it falls inside any event:

```js
function isDateBlocked(dateStr, blockingEvents) {
  const d = new Date(dateStr);
  return blockingEvents.some((e) => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    return d >= start && d <= end;
  });
}
```

### 2. When showing the calendar (month/week view)

- For the visible range (e.g. current month), call `GET /api/events/blocking?from=2025-03-01&to=2025-03-31`.
- For each day in the view, check if it falls inside any returned event’s `[start_date, end_date]`.
- Apply a **grey** (or disabled) style to those days so users see they cannot add planning there.

### 3. Backend validation (already in place)

If the user somehow picks a blocked date (e.g. old cached data), the API will reject the request:

- **Create planning** → `400 Bad Request`: “A planning session cannot be created or updated inside a blocking event period.”
- **Update planning** (changing date to a blocked day) → same message.

So the frontend should both **prevent** selection (grey/disable) and **handle** this error message if it still occurs.

## Summary

| Action | What to do |
|--------|------------|
| **Date picker (add planning)** | Fetch `GET /api/events/blocking`, disable every date inside any event’s `start_date`–`end_date`, show grey. |
| **Calendar view** | Fetch `GET /events/blocking?from=...&to=...` for visible range, grey out days that fall in any event. |
| **Error handling** | On create/update planning, show backend error “A planning session cannot be created or updated inside a blocking event period.” if the date was blocked. |
