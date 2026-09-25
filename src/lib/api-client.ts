// Browser-side fetch wrapper for our JSON API; throws an Error with the server's message on failure.
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}
