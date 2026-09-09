const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiError";
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body.detail) {
        message = Array.isArray(body.detail)
          ? body.detail.map((d) => d.msg).join(" ")
          : body.detail;
      }
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function listAppointments({ date, status } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  const qs = params.toString();
  return request(`/appointments${qs ? `?${qs}` : ""}`);
}

export function createAppointment(payload) {
  return request("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointment(id, payload) {
  return request(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function completeAppointment(id) {
  return request(`/appointments/${id}/complete`, { method: "PATCH" });
}

export function missAppointment(id) {
  return request(`/appointments/${id}/miss`, { method: "PATCH" });
}

export function cancelAppointment(id) {
  return request(`/appointments/${id}/cancel`, { method: "PATCH" });
}

export function restoreAppointment(id) {
  return request(`/appointments/${id}/restore`, { method: "PATCH" });
}

export { ApiError };
