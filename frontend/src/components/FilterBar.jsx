import { formatShort, shiftDate, todayISO } from "../dateUtils.js";

export default function FilterBar({ filters, onChange }) {
  const today = todayISO();
  const current = filters.date || today;
  const prev = shiftDate(current, -1);
  const next = shiftDate(current, 1);
  const isDefault = current === today && !filters.status;

  const selectDate = (date) => onChange({ ...filters, date });

  return (
    <div className="toolbar">
      <div className="date-strip">
        <button
          type="button"
          className="btn btn-icon"
          aria-label="Previous day"
          onClick={() => selectDate(prev)}
        >
          &larr;
        </button>

        <button
          type="button"
          className="date-strip-day"
          onClick={() => selectDate(prev)}
        >
          {formatShort(prev)}
        </button>

        <button type="button" className="date-strip-day date-strip-day-active">
          {formatShort(current)}
          {current === today && <span className="today-pill">Today</span>}
        </button>

        <button
          type="button"
          className="date-strip-day"
          onClick={() => selectDate(next)}
        >
          {formatShort(next)}
        </button>

        <button
          type="button"
          className="btn btn-icon"
          aria-label="Next day"
          onClick={() => selectDate(next)}
        >
          &rarr;
        </button>
      </div>

      <input
        type="date"
        className="date-jump"
        aria-label="Jump to date"
        value={current}
        onChange={(e) => selectDate(e.target.value)}
      />

      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">All statuses</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="missed">Missed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {!isDefault && (
        <button
          type="button"
          className="btn btn-link"
          onClick={() => onChange({ date: today, status: "" })}
        >
          Reset
        </button>
      )}
    </div>
  );
}
