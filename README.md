# Appointment Board

A small full-stack app for a team to view, add, edit, complete, and cancel
appointments, with server-side double-booking prevention.

**Stack:** React (Vite) frontend + FastAPI backend + SQLAlchemy (SQLite by
default, Postgres/MySQL-ready).

## Screenshots

**Board** — a day's appointments as an agenda/timeline, with status filters and day navigation:

![Appointment board](screenshots/board.png)

**Add Appointment** — live availability check against existing appointments as you fill in the time:

![Add appointment modal](screenshots/add-appointment.png)

## Overview

**How it works**
- The board shows one day at a time (defaulting to today), navigated with a
  prev/today/next day strip or a date picker, plus an optional status filter.
  Both are applied server-side via query params, not just in the browser.
- **Add Appointment** opens a modal for title, description, date, start time,
  and end time (start/end use a compact custom time picker in 15-minute
  increments, rather than the browser's inconsistent native time input). As
  you fill in the date/time, it shows a live **Availability** preview that
  checks the slot against existing appointments and names the exact
  conflict, if any, before you even submit.
- On submit, the **backend** re-validates everything (required fields, end
  time after start time, and no overlapping slot). The backend is the
  authority here, since a request can always skip the frontend.
- Every appointment has one of four statuses: `scheduled`, `completed`,
  `missed`, `cancelled`. None of the actions below ever delete an
  appointment; they change its status, and a "⋮" menu on each appointment
  only offers the transitions that make sense for its current status
  (details in "Appointment lifecycle" below), including undoing/restoring a
  status change.
- If a scheduled appointment's end time passes, the app doesn't guess what
  happened. It shows a "mark as completed or missed" nudge and leaves the
  call to the user.
- Cancelling asks for confirmation first, and the confirmation dialog says
  explicitly that the appointment will stay visible, marked as cancelled.
- **Edit** is only available while `scheduled`, and reuses the same
  validation/conflict check, excluding the appointment being edited from its
  own conflict search.

**Assumptions**
- Only one team/calendar is modeled, with no per-user accounts or auth.
- Appointments don't recur; each is a single date + time range.
- No timezones. All times are treated as the same local time for the whole
  team.
- An appointment can only be edited while `scheduled`; to change the time of
  a completed/missed/cancelled one, restore it to scheduled first.
- A conflict is only checked against appointments on the *same date*.

## Appointment lifecycle

**Cancellation (and every other outcome) is a status, not a delete.** The
spec requires cancelled appointments to remain visible; deleting the row
would lose that history. There are four statuses: `scheduled`, `completed`,
`missed`, `cancelled`.
**Missed and cancelled are deliberately different things.** Cancelled means
the appointment was intentionally called off ahead of time; missed means it
was expected to happen but the other party didn't show. That distinction is
real business data worth keeping, so it isn't collapsed into one "not
happening" status.

Rather than allow any status to change to any other status (which turns the
"⋮" menu into a raw database editor), each action is only offered where it
makes sense:

| From \ Action | Complete | Miss | Cancel | Undo / Restore (→ scheduled) |
|---|---|---|---|---|
| **scheduled**  | ✅ | ✅ | ✅ | n/a |
| **completed**  | n/a | ✅ | ✅ | ✅ |
| **missed**     | ✅ | n/a | ✅ | ✅ |
| **cancelled**  | n/a | n/a | n/a | ✅ |

Edit is only available while `scheduled`. Once an appointment has an
outcome, editing its time doesn't make sense; the intended fix is
undo/restore back to scheduled, then edit.

**Cancelled frees the time slot; completed and missed don't.** A cancelled
appointment never happened, so its slot is available again. Completed and
missed appointments both occupy a real point in the team's history, so you
shouldn't be able to double-book over either of them.

**Undo/restore back to `scheduled` re-runs the conflict check.** While an
appointment was cancelled (or completed/missed), something else may have
been booked into that same slot. Restoring it has to fail the same way a
brand-new booking would if the slot's now taken. It's the same conflict
check (`raise_if_conflict` in `services.py`), just triggered from a
different action.

**The board never auto-marks anything as missed.** When a scheduled
appointment's end time passes, the app doesn't guess what happened. It
shows a small inline nudge ("mark it as completed or missed") and leaves the
call to the user. Guessing attendance is exactly the kind of assumption a
scheduling tool shouldn't make on its own.

**Conflict detection lives on the backend, not just the frontend.** Frontend
validation is for a responsive UX, but anyone can call the API directly and
skip the browser. The backend is the authority: `find_conflict` in
[`backend/app/services.py`](backend/app/services.py) is the single source of
truth, used by both create and edit.

**The overlap check is a standard interval comparison:**
```
existing.start < new.end  AND  existing.end > new.start
```
This means:
- `10:00-11:00` and `10:30-11:30` → conflict (partial overlap)
- `10:00-11:00` and `10:00-11:00` → conflict (exact overlap)
- `10:00-12:00` and `10:30-11:00` → conflict (fully nested)
- `10:00-11:00` and `11:00-12:00` → **allowed** (adjacent, not overlapping,
  since the comparison is strict: `<`/`>` not `<=`/`>=`)

(See "Appointment lifecycle" above for which statuses block a slot.)

## Project structure

```
appointment-board/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup seeding
│   │   ├── database.py      # SQLAlchemy engine/session (SQLite or Postgres/MySQL)
│   │   ├── models.py        # Appointment ORM model + status enum
│   │   ├── schemas.py       # Pydantic request/response schemas + validation
│   │   ├── services.py      # Business logic: conflict detection, state transitions
│   │   └── routers/
│   │       └── appointments.py  # REST endpoints
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api.js                     # fetch wrapper for the backend
        ├── App.jsx                    # top-level state + data flow
        └── components/
            ├── FilterBar.jsx
            ├── AppointmentBoard.jsx
            ├── AppointmentItem.jsx
            ├── AppointmentForm.jsx    # add/edit modal
            └── Toast.jsx
```

## API

| Method | Path                          | Description                          |
|--------|-------------------------------|---------------------------------------|
| GET    | `/appointments?date=&status=` | List appointments, optionally filtered |
| POST   | `/appointments`                | Create an appointment                 |
| PATCH  | `/appointments/{id}`           | Edit a scheduled appointment          |
| PATCH  | `/appointments/{id}/complete`  | Mark as completed (from scheduled/missed) |
| PATCH  | `/appointments/{id}/miss`      | Mark as missed (from scheduled/completed) |
| PATCH  | `/appointments/{id}/cancel`    | Mark as cancelled (from scheduled/completed/missed) |
| PATCH  | `/appointments/{id}/restore`   | Restore to scheduled (from completed/missed/cancelled); re-checks for conflicts |

Interactive docs are auto-generated by FastAPI at `http://127.0.0.1:8000/docs`
once the backend is running.

## Running locally

### Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This creates a local `appointments.db` SQLite file and seeds it with sample
appointments on first run. No database installation required.

**To use Postgres or MySQL instead:** install the driver
(`pip install -r requirements-postgres.txt` for Postgres, or `pip install
pymysql` for MySQL) and set `DATABASE_URL` before starting the server, e.g.:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/appointments"
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). It talks to
the backend at `http://127.0.0.1:8000` by default. Change this via
`frontend/.env` (`VITE_API_URL`) if needed.

## Sample data

The backend seeds 12 appointments across 4 days (yesterday through two days
from now) the first time it starts, with a mix of durations and all four
statuses (scheduled, completed, missed, cancelled), including one overdue
scheduled appointment to show the "mark as completed or missed" nudge. That
way filtering, day navigation, editing, and every status transition are
reviewable immediately without adding data first.

## UX note: the board is day-focused, not a flat list

The board always shows one day at a time (defaulting to today), navigated
with the prev/today/next day strip or the date picker next to it. Filtering
by status narrows within that day rather than across the whole dataset. This
was a deliberate choice: showing every date's appointments in one long list
at once made the prev/next day arrows ambiguous (what do they page through,
if everything is already visible?). Anchoring the arrows to "which single day
am I looking at" keeps the navigation's meaning unambiguous.
