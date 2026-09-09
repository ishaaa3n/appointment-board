import { formatLong, todayISO } from "../dateUtils.js";
import AppointmentItem from "./AppointmentItem.jsx";

function statusBreakdown(items) {
  const counts = { scheduled: 0, completed: 0, missed: 0, cancelled: 0 };
  items.forEach((a) => counts[a.status]++);
  return [
    counts.scheduled && `${counts.scheduled} scheduled`,
    counts.completed && `${counts.completed} completed`,
    counts.missed && `${counts.missed} missed`,
    counts.cancelled && `${counts.cancelled} cancelled`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function AppointmentBoard({
  appointments,
  loading,
  filters,
  onAddClick,
  onEdit,
  onComplete,
  onMiss,
  onRestore,
  onRequestCancel,
}) {
  if (loading) {
    return <div className="board-empty">Loading appointments...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="board-empty">
        <p className="board-empty-title">No appointments</p>
        <p className="board-empty-body">
          {filters.status
            ? `No ${filters.status} appointments on ${formatLong(filters.date)}.`
            : `Nothing scheduled for ${formatLong(filters.date)}.`}
        </p>
        <button type="button" className="btn btn-primary" onClick={onAddClick}>
          + Add Appointment
        </button>
      </div>
    );
  }

  const grouped = appointments.reduce((acc, appt) => {
    (acc[appt.date] ||= []).push(appt);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <div className="board">
      {dates.map((date) => (
        <div key={date} className="board-group">
          <h3 className="board-group-heading">
            {formatLong(date)}
            {date === todayISO() && <span className="today-pill">Today</span>}
            <span className="board-group-count">
              {grouped[date].length} appointment
              {grouped[date].length === 1 ? "" : "s"}
              {" · "}
              {statusBreakdown(grouped[date])}
            </span>
          </h3>
          <div className="board-group-list">
            {grouped[date].map((appt) => (
              <AppointmentItem
                key={appt.id}
                appointment={appt}
                onEdit={onEdit}
                onComplete={onComplete}
                onMiss={onMiss}
                onRestore={onRestore}
                onRequestCancel={onRequestCancel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
