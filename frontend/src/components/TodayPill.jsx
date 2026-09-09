export default function TodayPill({ chip = false }) {
  return (
    <span className={`today-pill${chip ? " today-pill-chip" : ""}`}>
      <span className="today-pill-dot" />
      Today
    </span>
  );
}
