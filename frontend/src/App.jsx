import { useCallback, useEffect, useState } from "react";

import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  listAppointments,
  missAppointment,
  restoreAppointment,
  updateAppointment,
} from "./api.js";
import AppointmentBoard from "./components/AppointmentBoard.jsx";
import AppointmentForm from "./components/AppointmentForm.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Toast from "./components/Toast.jsx";
import { formatMedium, formatTimeLabel, todayISO } from "./dateUtils.js";

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: todayISO(), status: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAppointments({
        date: filters.date || undefined,
        status: filters.status || undefined,
      });
      setAppointments(data);
    } catch (err) {
      showToast("error", err.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAddForm = () => {
    setEditingAppointment(null);
    setFormOpen(true);
  };

  const openEditForm = (appointment) => {
    setEditingAppointment(appointment);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, payload);
        showToast("success", `"${payload.title}" was updated.`);
      } else {
        await createAppointment(payload);
        showToast("success", `"${payload.title}" was added to the board.`);
      }
      closeForm();
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (appointment) => {
    try {
      await completeAppointment(appointment.id);
      showToast("success", `"${appointment.title}" marked as completed.`);
      await refresh();
    } catch (err) {
      showToast("error", err.message || "Could not complete appointment.");
    }
  };

  const handleMiss = async (appointment) => {
    try {
      await missAppointment(appointment.id);
      showToast("success", `"${appointment.title}" marked as missed.`);
      await refresh();
    } catch (err) {
      showToast("error", err.message || "Could not mark appointment as missed.");
    }
  };

  const handleRestore = async (appointment) => {
    try {
      await restoreAppointment(appointment.id);
      showToast("success", `"${appointment.title}" was restored to scheduled.`);
      await refresh();
    } catch (err) {
      showToast("error", err.message || "Could not restore appointment.");
    }
  };

  const confirmCancel = async () => {
    const appointment = cancelTarget;
    setCancelTarget(null);
    try {
      await cancelAppointment(appointment.id);
      showToast("success", `"${appointment.title}" was cancelled.`);
      await refresh();
    } catch (err) {
      showToast("error", err.message || "Could not cancel appointment.");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Appointments</h1>
          <p className="app-subtitle">Manage your team's schedule</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddForm}>
          + Add Appointment
        </button>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <AppointmentBoard
        appointments={appointments}
        loading={loading}
        filters={filters}
        onAddClick={openAddForm}
        onEdit={openEditForm}
        onComplete={handleComplete}
        onMiss={handleMiss}
        onRestore={handleRestore}
        onRequestCancel={setCancelTarget}
      />

      {formOpen && (
        <AppointmentForm
          editingAppointment={editingAppointment}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel appointment?"
          body={
            <>
              <p className="confirm-appointment-title">
                "{cancelTarget.title}"
              </p>
              <p className="confirm-appointment-meta">
                {formatMedium(cancelTarget.date)} ·{" "}
                {formatTimeLabel(cancelTarget.start_time.slice(0, 5))}
                {" – "}
                {formatTimeLabel(cancelTarget.end_time.slice(0, 5))}
              </p>
              <p>This appointment will remain visible on the board, marked as cancelled.</p>
            </>
          }
          confirmLabel="Cancel appointment"
          onConfirm={confirmCancel}
          onDismiss={() => setCancelTarget(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
