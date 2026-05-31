export function formatDate(value: string | number): string {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function daysLeft(endDate: string): number {
  const end = new Date(endDate).getTime();
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
