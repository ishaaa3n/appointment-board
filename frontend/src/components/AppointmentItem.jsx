import { useEffect, useRef, useState } from "react";

import { formatTimeLabel } from "../dateUtils.js";

function isOverdue(appointment) {
  if (appointment.status !== "scheduled") return false;
  const end = new Date(`${appointment.date}T${appointment.end_time}`);
  return end.getTime() < Date.now();
}

const STATUS_LABEL = {
  scheduled: "Scheduled",
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
};

export default function AppointmentItem({
  appointment,
  isLast,
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
      { label: "Edit", onClick: closeMenuThen(onEdit) },
      { label: "Mark as completed", onClick: closeMenuThen(onComplete) },
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
    <div className={`agenda-row status-${status}${isLast ? " agenda-row-last" : ""}`}>
      <div className="agenda-time">
        <span>{formatTimeLabel(start_time)}</span>
        <span className="agenda-time-end">{formatTimeLabel(end_time)}</span>
      </div>

      <div className="agenda-rail">
        <span className={`agenda-dot dot-${status}`} />
      </div>

      <div className="agenda-content">
        <div className="agenda-title-row">
          <span className="agenda-title">{title}</span>
          <span className={`agenda-status status-${status}`}>
            <span className="status-dot" />
            {STATUS_LABEL[status]}
          </span>

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
        </div>

        {description && <div className="agenda-description">{description}</div>}

        {overdue && (
          <div className="agenda-overdue">
            &#9888; Time has passed &middot; mark as completed or missed
          </div>
        )}
      </div>
    </div>
  );
}
