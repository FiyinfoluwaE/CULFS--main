// Central API helper. Reads base URL from Vite env variable VITE_API_URL
// Fallbacks to http://localhost:5000 for local development.
// Read base from Vite env (if present) or fallback to localhost.
const rawBase: string =
  (import.meta.env && (import.meta.env as any).VITE_API_URL) ||
  "http://localhost:5000";

// Normalize: remove trailing slashes so joining doesn't produce double segments
export const apiBase: string = rawBase.replace(/\/+$|\s+$/g, "");

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // If a full URL is provided, use it unchanged.
  if (path.startsWith("http")) return fetch(path, init);

  // Ensure single slash between base and path
  const cleanedPath = path.replace(/^\/+/, "");
  const url = `${apiBase}/${cleanedPath}`;
  return fetch(url, init);
}

export default apiFetch;
