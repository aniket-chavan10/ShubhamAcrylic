export function getImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/uploads")) {
    return `http://localhost:5000${url}`;
  }
  return `http://localhost:5000/uploads/${url}`;
}
