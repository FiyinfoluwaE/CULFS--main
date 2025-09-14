// Central API helper. Reads base URL from Vite env variable VITE_API_URL
// Fallbacks to http://localhost:5000 for local development.
// Read base from Vite env (if present) or fallback to localhost.
// Use Vite env if set; otherwise fall back to the deployed backend so production
// builds without the env var still work. Remove this fallback once Netlify is
// configured with VITE_API_URL.
const rawBase: string =
  (import.meta.env && (import.meta.env as any).VITE_API_URL) ||
  "https://culfs-main-production.up.railway.app";

// Normalize: remove trailing slashes so joining doesn't produce double segments
// Normalize base: trim whitespace and trailing slashes, and if someone set
// VITE_API_URL to include a trailing '/api' strip that too so callers that pass
// '/api/...' won't produce '/api/api/...'.
let normalized = rawBase.trim().replace(/\/+$/g, "");
if (normalized.toLowerCase().endsWith("/api")) {
  normalized = normalized.slice(0, -4);
}
export const apiBase: string = normalized;

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  // If a full URL is provided, use it unchanged.
  if (path.startsWith("http")) return fetch(path, init);

  // Ensure single slash between base and path
  const cleanedPath = path.replace(/^\/+/, "");
  const url = `${apiBase}/${cleanedPath}`;
  return fetch(url, init);
}

export default apiFetch;
