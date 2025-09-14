// Central API helper. Reads base URL from Vite env variable VITE_API_URL
// Fallbacks to http://localhost:5000 for local development.
export const apiBase: string =
  (import.meta.env && (import.meta.env as any).VITE_API_URL) ||
  "http://localhost:5000";

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  // If a full URL is provided, use it unchanged.
  const url = path.startsWith("http") ? path : `${apiBase}${path}`;
  return fetch(url, init);
}

export default apiFetch;
