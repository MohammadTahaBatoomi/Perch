export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}
