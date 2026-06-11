export function formatHour(decimal) {
  const h = Math.floor(decimal) % 24;
  const m = Math.round((decimal - Math.floor(decimal)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function statusLabel(status) {
  const map = {
    offDuty: "Off Duty",
    sleeperBerth: "Sleeper Berth",
    driving: "Driving",
    onDutyNotDriving: "On Duty (Not Driving)",
  };
  return map[status] || status;
}
