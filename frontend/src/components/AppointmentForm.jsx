import { useEffect, useRef, useState } from "react";

import { listAppointments } from "../api.js";
import TimeSelect from "./TimeSelect.jsx";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  start_time: "09:00",
  end_time: "09:30",
};

function toFormState(appointment) {
  if (!appointment) return emptyForm;
  return {
    title: appointment.title,
    description: appointment.description || "",
    date: appointment.date,
    start_time: appointment.start_time.slice(0, 5),
    end_time: appointment.end_time.slice(0, 5),
  };
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.date) errors.date = "Date is required.";
  if (!form.start_time) errors.start_time = "Start time is required.";
  if (!form.end_time) errors.end_time = "End time is required.";
  if (form.start_time && form.end_time && form.end_time <= form.start_time) {
    errors.end_time = "End time must be after start time.";
  }
  return errors;
}

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Client-side preview only, for instant feedback while typing. The backend
// re-checks this authoritatively on submit, since it has the latest data
// and can't be bypassed.
function findLocalConflict(existing, form, excludeId) {
  return existing.find(
    (a) =>
      a.id !== excludeId &&
      a.status !== "cancelled" &&
      a.start_time.slice(0, 5) < form.end_time &&
      a.end_time.slice(0, 5) > form.start_time
  );
}

export default function AppointmentForm({
  editingAppointment,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [form, setForm] = useState(() => toFormState(editingAppointment));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [availability, setAvailability] = useState(null); // null | {state, conflict}
  const debounceRef = useRef(null);

  const isEditing = Boolean(editingAppointment);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);

    const ready =
      form.date &&
      form.start_time &&
      form.end_time &&
      form.end_time > form.start_time;

    if (!ready) {
      setAvailability(null);
      return;
    }

    setAvailability({ state: "checking" });
    debounceRef.current = setTimeout(async () => {
      try {
        const existing = await listAppointments({ date: form.date });
        const conflict = findLocalConflict(
          existing,
          form,
          editingAppointment?.id
        );
        setAvailability(
          conflict ? { state: "conflict", conflict } : { state: "available" }
        );
      } catch {
        setAvailability(null);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.start_time, form.end_time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setServerError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
      });
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? "Edit Appointment" : "Add Appointment"}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="e.g. Client Demo"
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Optional details"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={handleChange("date")}
              />
              {errors.date && <div className="field-error">{errors.date}</div>}
            </div>

            <div className="field">
              <label htmlFor="start_time">Start time *</label>
              <TimeSelect
                id="start_time"
                value={form.start_time}
                onChange={handleChange("start_time")}
              />
              {errors.start_time && (
                <div className="field-error">{errors.start_time}</div>
              )}
            </div>

            <div className="field">
              <label htmlFor="end_time">End time *</label>
              <TimeSelect
                id="end_time"
                value={form.end_time}
                onChange={handleChange("end_time")}
              />
              {errors.end_time && (
                <div className="field-error">{errors.end_time}</div>
              )}
            </div>
          </div>

          {availability && (
            <div className="availability">
              <div className="availability-label">Availability</div>
              {availability.state === "checking" && (
                <div className="availability-row availability-checking">
                  Checking...
                </div>
              )}
              {availability.state === "available" && (
                <div className="availability-row availability-ok">
                  ✓ This time slot is available
                </div>
              )}
              {availability.state === "conflict" && (
                <div className="availability-row availability-conflict">
                  ⚠ This overlaps with "{availability.conflict.title}" (
                  {formatTime(availability.conflict.start_time.slice(0, 5))}
                  {" – "}
                  {formatTime(availability.conflict.end_time.slice(0, 5))})
                </div>
              )}
            </div>
          )}

          {serverError && <div className="form-error">⚠ {serverError}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
