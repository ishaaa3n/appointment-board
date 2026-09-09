import { useEffect, useRef, useState } from "react";

function formatTime(t) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

function isOverdue(appointment) {
  if (appointment.status !== "scheduled") return false;
  const end = new Date(`${appointment.date}T${appointment.end_time}`);
  return end.getTime() < Date.now();
}

export default function AppointmentItem({
  appointment,
  onEdit,
  onComplete,
  onMiss,
  onRestore,
  onRequestCancel,
}) {
  const { title, description, start_time, end_time, status } = appointment;
  const overdue = isOverdue(appointment);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const closeMenuThen = (fn) => () => {
    setMenuOpen(false);
    fn(appointment);
  };

  let menuItems = [];
  if (status === "scheduled") {
    menuItems = [
      { label: "Mark as missed", onClick: closeMenuThen(onMiss) },
      {
        label: "Cancel appointment",
        onClick: closeMenuThen(onRequestCancel),
        danger: true,
      },
    ];
  } else if (status === "completed") {
    menuItems = [
      { label: "Undo completed", onClick: closeMenuThen(onRestore) },
      { label: "Mark as missed", onClick: closeMenuThen(onMiss) },
      {
        label: "Cancel appointment",
        onClick: closeMenuThen(onRequestCancel),
        danger: true,
      },
    ];
  } else if (status === "missed") {
    menuItems = [
      { label: "Undo missed", onClick: closeMenuThen(onRestore) },
      { label: "Mark as completed", onClick: closeMenuThen(onComplete) },
      {
        label: "Cancel appointment",
        onClick: closeMenuThen(onRequestCancel),
        danger: true,
      },
    ];
  } else if (status === "cancelled") {
    menuItems = [{ label: "Restore appointment", onClick: closeMenuThen(onRestore) }];
  }

  return (
    <div className={`appointment-item status-${status}${overdue ? " is-overdue" : ""}`}>
      <div className="appointment-time">
        {formatTime(start_time)}
        <span className="appointment-time-sep">&ndash;</span>
        {formatTime(end_time)}
      </div>

      <div className="appointment-body">
        <div className="appointment-title-row">
          <span className="appointment-title">{title}</span>
          <span className={`badge badge-${status}`}>{status}</span>
        </div>
        {description && <div className="appointment-description">{description}</div>}
        {overdue && (
          <div className="appointment-overdue-hint">
            This appointment's time has passed — mark it as completed or missed.
          </div>
        )}
      </div>

      <div className="appointment-actions">
        {status === "scheduled" && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(appointment)}
            >
              Edit
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() => onComplete(appointment)}
            >
              Complete
            </button>
          </>
        )}

        {menuItems.length > 0 && (
          <div className="menu-wrap" ref={menuRef}>
            <button
              className="btn btn-icon"
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              &#8942;
            </button>
            {menuOpen && (
              <div className="menu">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    className={`menu-item${item.danger ? " menu-item-danger" : ""}`}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
