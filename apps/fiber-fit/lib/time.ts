/** Local calendar YYYY-MM-DD. */
export function ymd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function utcDay(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function calendarDiff(startYmd: string, todayYmd: string): number {
  return Math.round((utcDay(todayYmd) - utcDay(startYmd)) / 86_400_000);
}

/** 0-based day in the pact. Negative = before start. >= days = after last day. */
export function dayIndex(startDate: string, days: number, now = new Date()): number {
  return calendarDiff(startDate, ymd(now));
}

export function isFutureDay(startDate: string, dayIndexValue: number, now = new Date()): boolean {
  return dayIndexValue > dayIndex(startDate, 365, now);
}

export function nowStamp(now = new Date()): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TINTS = ["#D6FF3A", "#3DFF9A", "#E6C36A", "#8EC8FF", "#C4A7FF", "#FF9A6B", "#F3F6F1", "#7E877C"];

export function tintFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

export function unitLabel(unit: string): string {
  switch (unit) {
    case "steps":
      return "steps";
    case "active_min":
      return "active min";
    case "workouts":
      return "workouts";
    case "sessions":
      return "sessions";
    case "km":
      return "km";
    case "minutes":
      return "min";
    case "checkin":
      return "show up";
    case "yesno":
      return "yes";
    default:
      return unit;
  }
}

export function unitsForFiber(fiber: string): { unit: string; label: string; defaultBar: number }[] {
  switch (fiber) {
    case "Move":
      return [
        { unit: "steps", label: "steps", defaultBar: 10000 },
        { unit: "active_min", label: "active min", defaultBar: 30 },
      ];
    case "Train":
      return [{ unit: "workouts", label: "workouts", defaultBar: 1 }];
    case "Lift":
      return [{ unit: "sessions", label: "sessions", defaultBar: 1 }];
    case "Run":
    case "Ride":
      return [
        { unit: "km", label: "km", defaultBar: 5 },
        { unit: "minutes", label: "minutes", defaultBar: 30 },
      ];
    case "Show up":
      return [{ unit: "checkin", label: "check-in", defaultBar: 1 }];
    default:
      return [{ unit: "yesno", label: "yes / no", defaultBar: 1 }];
  }
}

export function needsNumericProof(unit: string): boolean {
  return unit !== "checkin" && unit !== "yesno";
}

export function newId(): string {
  return crypto.randomUUID();
}
