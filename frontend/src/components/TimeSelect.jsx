import { useEffect, useRef, useState } from "react";

const OPTIONS = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
      options.push({ value, label });
    }
  }
  return options;
})();

export default function TimeSelect({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
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
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="time-select-caret">&#9662;</span>
      </button>

      {open && (
        <ul className="time-select-list" role="listbox">
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
