export type PreviewKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "unsupported";

export function getPreviewKind(
  mimeType?: string | null,
  fileName?: string | null,
): PreviewKind {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();

  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(name)) {
    return "image";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (mime.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/.test(name)) {
    return "video";
  }
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) {
    return "audio";
  }
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    /\.(txt|md|csv|json|xml|log|ts|tsx|js|jsx|css|html|py|rs|go)$/.test(name)
  ) {
    return "text";
  }
  return "unsupported";
}

export function canPreviewInline(
  mimeType?: string | null,
  fileName?: string | null,
) {
  return getPreviewKind(mimeType, fileName) !== "unsupported";
}
