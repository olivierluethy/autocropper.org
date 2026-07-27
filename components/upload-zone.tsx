"use client";

import { useCallback, useRef, useState } from "react";
import { ImageDown, Upload } from "lucide-react";
import { track } from "@/lib/analytics";

// Phone photos (HEIC/high-res PNG) routinely exceed 10 MB, so the old cap was a
// common dead-end. The pipeline downscales the working resolution defensively,
// so we can accept much larger files and still stay memory-safe.
const MAX_BYTES = 40 * 1024 * 1024;

// Permissive `accept`: `image/*` plus explicit extensions the OS pickers don't
// always map to a MIME type (HEIC, TIFF, SVG, …), so valid files aren't greyed
// out on iOS/Android. Real format detection happens downstream via magic bytes.
const ACCEPT_ATTR =
  "image/*,.heic,.heif,.tif,.tiff,.avif,.svg,.psd,.ico,.bmp,.jxl";

interface Props {
  onFile: (file: File) => void;
  busy?: boolean;
  compact?: boolean;
}

type Source = "drop" | "picker" | "paste";

export function UploadZone({ onFile, busy, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    // Format is no longer gated here: the decode pipeline sniffs the real format
    // from magic bytes and returns a specific, actionable message if it truly
    // can't read the file. That keeps us from dead-ending obvious images (a HEIC
    // with a .jpg name, an SVG, a mislabelled export). Only size is enforced up
    // front, since it's the one thing we can cheaply check without decoding.
    if (file.size > MAX_BYTES) {
      return "This image is over 40 MB. Try exporting a smaller version.";
    }
    if (file.size === 0) {
      return "That file is empty. Try re-exporting it.";
    }
    return null;
  }, []);

  const handle = useCallback(
    (file: File, source: Source) => {
      // One generic funnel-entry event…
      track("upload_attempt", {
        source,
        size_kb: Math.round(file.size / 1024),
        type: file.type || "unknown",
      });
      const err = validate(file);
      if (err) {
        setWarning(err);
        track("upload_error", {
          reason: err.slice(0, 60),
          source,
          stage: "validation",
        });
        return;
      }
      setWarning(null);
      // Canonical funnel event. The tool takes one image at a time, so
      // `count` is always 1 — kept as a property so the shape survives if
      // multi-file upload ever lands.
      track("image_uploaded", {
        count: 1,
        total_bytes: file.size,
        file_types: [file.type || "unknown"],
        source,
      });
      // …plus a per-source event so funnels per upload method are easy.
      if (source === "drop") track("upload_drop", { size_kb: Math.round(file.size / 1024) });
      else if (source === "picker") track("upload_click", { size_kb: Math.round(file.size / 1024) });
      else track("upload_paste", { size_kb: Math.round(file.size / 1024) });
      onFile(file);
    },
    [onFile, validate],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handle(file, "drop");
    },
    [handle],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handle(file, "picker");
      e.target.value = "";
    },
    [handle],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) handle(file, "paste");
    },
    [handle],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-busy={busy}
      aria-label="Drop your logo here or click to upload"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={[
        "group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all",
        "bg-[var(--color-bg-elev)] cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        drag
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border-strong)] hover:border-[var(--color-fg-muted)]",
        compact ? "p-6" : "p-8 sm:p-14",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT_ATTR}
        onChange={onPick}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-full transition-transform",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            drag ? "scale-110" : "group-hover:scale-105",
          ].join(" ")}
        >
          {drag ? <ImageDown className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
        </div>
        <div>
          <p className={compact ? "text-base font-semibold" : "text-xl sm:text-2xl font-semibold tracking-tight"}>
            {drag ? "Drop it" : "Add your logo"}
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-fg-muted)]">
            <span className="underline underline-offset-2">Tap to upload</span>
            <span className="hidden sm:inline"> or drop a file</span> · PNG, JPG, SVG, HEIC &amp; more
          </p>
        </div>
        <p className="text-xs text-[var(--color-fg-subtle)]">
          Processed entirely on your device. Nothing uploaded.
        </p>
      </div>
      {warning ? (
        <div role="alert" className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-600 dark:text-amber-400">
          {warning}
        </div>
      ) : null}
    </div>
  );
}
