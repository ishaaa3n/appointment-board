import { useEffect, useRef, useState } from "react";

import { formatTimeLabel } from "../dateUtils.js";

const OPTIONS = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      options.push({ value, label: formatTimeLabel(value) });
    }
  }
  return options;
})();

const LIST_HEIGHT = 168; // max-height of .time-select-list plus a small margin

export default function TimeSelect({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const wrapRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const handleToggle = () => {
    if (!open && wrapRef.current) {
      const triggerRect = wrapRef.current.getBoundingClientRect();
      const modal = wrapRef.current.closest(".modal");
      const containerBottom = modal
        ? modal.getBoundingClientRect().bottom
        : window.innerHeight;
      const spaceBelow = Math.min(containerBottom, window.innerHeight) - triggerRect.bottom;
      setOpenUpward(spaceBelow < LIST_HEIGHT);
    }
    setOpen((o) => !o);
  };

  const selectedLabel = OPTIONS.find((o) => o.value === value)?.label || "Select time";

  const choose = (v) => {
    onChange({ target: { value: v } });
    setOpen(false);
  };

  return (
    <div className="time-select" ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="time-select-trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="time-select-caret">&#9662;</span>
      </button>

      {open && (
        <ul
          className={`time-select-list${openUpward ? " time-select-list-up" : ""}`}
          role="listbox"
        >
          {OPTIONS.map((opt) => (
            <li
              key={opt.value}
              ref={opt.value === value ? selectedRef : null}
              role="option"
              aria-selected={opt.value === value}
              className={
                "time-select-option" +
                (opt.value === value ? " time-select-option-active" : "")
              }
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
