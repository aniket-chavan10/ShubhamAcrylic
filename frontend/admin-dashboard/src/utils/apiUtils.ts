const API_URL = "http://localhost:5000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("User not authenticated");
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    // Ensure Content-Type is set for JSON bodies if not already set (and not FormData)
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        // @ts-ignore
        headers["Content-Type"] = "application/json";
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
    }

    return response;
}
