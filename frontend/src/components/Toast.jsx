export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
