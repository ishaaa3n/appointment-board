export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep appointment",
  onConfirm,
  onDismiss,
}) {
  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="confirm-body">{body}</div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onDismiss}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
