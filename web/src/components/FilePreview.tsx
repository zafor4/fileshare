"use client";

import { useEffect, useState } from "react";
import { getPreviewKind } from "@/lib/filePreview";

type Props = {
  src: string;
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
};

export function FilePreview({ src, mimeType, fileName, className }: Props) {
  const kind = getPreviewKind(mimeType, fileName);
  const [text, setText] = useState<string | null>(null);
  const [textError, setTextError] = useState("");

  useEffect(() => {
    if (kind !== "text") return;
    let cancelled = false;
    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load file");
        const body = await res.text();
        if (!cancelled) setText(body.slice(0, 200_000));
      })
      .catch((e) => {
        if (!cancelled) {
          setTextError(e instanceof Error ? e.message : "Preview failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind, src]);

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={fileName || "Preview"}
        className={`max-h-[70vh] w-full rounded-2xl object-contain bg-stone-100 ${className || ""}`}
      />
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        title={fileName || "PDF preview"}
        src={src}
        className={`h-[70vh] w-full rounded-2xl border border-line bg-white ${className || ""}`}
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        controls
        src={src}
        className={`max-h-[70vh] w-full rounded-2xl bg-black ${className || ""}`}
      />
    );
  }

  if (kind === "audio") {
    return (
      <div className={`rounded-2xl border border-line bg-white p-4 ${className || ""}`}>
        <audio controls src={src} className="w-full" />
      </div>
    );
  }

  if (kind === "text") {
    if (textError) return <p className="text-sm text-danger">{textError}</p>;
    if (text === null) return <p className="text-sm text-muted">Loading preview…</p>;
    return (
      <pre className={`max-h-[70vh] overflow-auto rounded-2xl bg-stone-100 p-4 text-sm ${className || ""}`}>
        {text}
      </pre>
    );
  }

  return (
    <div className={`rounded-2xl border border-dashed border-line px-4 py-10 text-center ${className || ""}`}>
      <p className="font-bold">Preview not available for this file type</p>
      <p className="mt-1 text-sm text-muted">
        {fileName || "This file"} can still be downloaded.
      </p>
    </div>
  );
}
