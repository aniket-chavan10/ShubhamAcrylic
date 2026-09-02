export function getImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
    // Derive the server base URL from the API URL (strip /api suffix)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const API_BASE = API_URL.replace(/\/api\/?$/, '');

    if (url.startsWith("/uploads")) {
      return `${API_BASE}${url}`;
    }
    return `${API_BASE}/uploads/${url}`;
}
