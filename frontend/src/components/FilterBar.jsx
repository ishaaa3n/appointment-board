import { formatShort, formatWeekdayShort, shiftDate, todayISO } from "../dateUtils.js";
import TodayPill from "./TodayPill.jsx";

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
          <span className="date-strip-date">{formatShort(prev)}</span>
          <span className="date-strip-weekday">{formatWeekdayShort(prev)}</span>
        </button>

        <button type="button" className="date-strip-day date-strip-day-active">
          <span className="date-strip-label">
            <span className="date-strip-date">{formatShort(current)}</span>
            <span className="date-strip-weekday">{formatWeekdayShort(current)}</span>
          </span>
          {current === today && <TodayPill />}
        </button>

        <button
          type="button"
          className="date-strip-day"
          onClick={() => selectDate(next)}
        >
          <span className="date-strip-date">{formatShort(next)}</span>
          <span className="date-strip-weekday">{formatWeekdayShort(next)}</span>
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
