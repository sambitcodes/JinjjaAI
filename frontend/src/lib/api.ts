let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
if (baseUrl && !baseUrl.includes("/api/v1")) {
  baseUrl = baseUrl.replace(/\/$/, "") + "/api/v1";
}
const API_BASE_URL = baseUrl;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Something went wrong");
  }

  return response.json();
}

// Ensure user is logged in, otherwise redirect to /login
export async function ensureAuthenticated() {
  if (typeof window === "undefined") return null;
  
  let token = localStorage.getItem("token");
  if (token) {
    try {
      return await apiRequest("/auth/me");
    } catch (err) {
      console.warn("Session expired or token invalid. Clearing session.");
      localStorage.removeItem("token");
    }
  }

  // Redirect to landing page (/) if not authenticated
  if (window.location.pathname !== "/" && window.location.pathname !== "/onboarding") {
    window.location.href = "/";
  }
  return null;
}
