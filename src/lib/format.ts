// Fixed locale so server and browser render the same strings.
const LOCALE = "en-GB";

const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
const date = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" });
const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export const formatTime = (d: Date | string) => time.format(new Date(d));
export const formatDate = (d: Date | string) => date.format(new Date(d));
export const formatPrice = (n: number) => money.format(n);

export function formatDuration(from: Date | string, to: Date | string) {
  const minutes = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/** Returns a safe in-app redirect target, falling back to "/". */
export function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
