const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export function fetchResponses({ page = 1, pageSize = 25 } = {}) {
  return apiFetch(`/api/admin/responses?page=${page}&pageSize=${pageSize}`);
}

export function fetchStats() {
  return apiFetch("/api/admin/stats");
}

export function fetchAnalytics() {
  return apiFetch("/api/admin/analytics");
}

export function fetchResponseDetail(phoneNumber) {
  return apiFetch(`/api/admin/responses/${encodeURIComponent(phoneNumber)}`);
}
