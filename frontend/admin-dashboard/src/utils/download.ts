/**
 * Save a file under a chosen name. Cross-origin URLs ignore the <a download>
 * attribute, so fetch the bytes first; if that is blocked, open it in a new tab.
 */
export async function downloadFile(url: string, fileName: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(String(res.status));
    const blobUrl = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

/** ".png" from ".../product-123.png?x=1" (defaults to .png) */
export const extOf = (url: string) => (url.split(/[?#]/)[0].match(/\.(png|jpe?g|webp)$/i)?.[0] ?? ".png").toLowerCase();
