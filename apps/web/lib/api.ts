const apiBase = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

function accessToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("mangystau-access-token");
}

export function saveSession(accessToken: string, user: any, isNewUser = false) {
  localStorage.setItem("mangystau-access-token", accessToken);
  localStorage.setItem("mangystau-user", JSON.stringify(user));
  if (isNewUser) {
    localStorage.removeItem("mangystau-resume");
    localStorage.removeItem("mangystau-resume-template");
    localStorage.removeItem("mangystau-resume-accent");
  }
  window.dispatchEvent(new Event("mangystau-session-change"));
}

export function clearSession() {
  localStorage.removeItem("mangystau-access-token");
  localStorage.removeItem("mangystau-user");
  localStorage.removeItem("mangystau-resume");
  localStorage.removeItem("mangystau-resume-template");
  localStorage.removeItem("mangystau-resume-accent");
  window.dispatchEvent(new Event("mangystau-session-change"));
}

async function send(path: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${apiBase}${path}`, { ...options, headers, credentials: "include" });
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await send(path, options, accessToken());
  if (response.status !== 401 || path === "/api/auth/refresh") return response;

  const refreshed = await fetch(`${apiBase}/api/auth/refresh`, { method: "POST", credentials: "include" });
  if (!refreshed.ok) {
    clearSession();
    return response;
  }

  const session = await refreshed.json();
  saveSession(session.accessToken, session.user);
  return send(path, options, session.accessToken);
}