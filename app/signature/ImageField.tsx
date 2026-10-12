"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/signature";
import ui from "@/components/tool.module.css";
import styles from "./signature.module.css";

const TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/** Upload an image (hosted for free) or paste a link to one you already host. */
export function ImageField({ value, onChange, hint }: { value: string; onChange: (url: string) => void; hint: string }) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!TYPES.includes(file.type)) return setError("Use a PNG, JPG, GIF or WebP image.");
    if (file.size > MAX_UPLOAD_BYTES)
      return setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 1 MB so emails load fast.`);
    try {
      setProgress(0);
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const blob = await upload(`signatures/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      onChange(blob.url);
    } catch {
      setError("Upload failed. Try again, or paste a link instead.");
    } finally {
      setProgress(null);
    }
  }

  if (value)
    return (
      <div className={styles.imageSet}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className={styles.imageThumb} />
        <span className={styles.imageUrl}>{value.replace(/^https?:\/\//, "")}</span>
        <button type="button" className={ui.textBtn} onClick={() => onChange("")}>
          Remove
        </button>
      </div>
    );

  return (
    <div>
      <div className={ui.segment} style={{ marginBottom: 10 }}>
        <button type="button" className={mode === "upload" ? ui.on : ""} onClick={() => setMode("upload")}>
          Upload
        </button>
        <button type="button" className={mode === "link" ? ui.on : ""} onClick={() => setMode("link")}>
          Paste a link
        </button>
      </div>
      {mode === "upload" ? (
        <label className={ui.drop}>
          <input type="file" accept={TYPES.join(",")} onChange={(e) => onFile(e.target.files?.[0])} disabled={progress !== null} />
          {progress !== null ? (
            <>
              <span>Uploading… {Math.round(progress)}%</span>
              <span className={styles.progress}>
                <i style={{ width: `${progress}%` }} />
              </span>
            </>
          ) : (
            <>
              <span>Drop an image here or click to upload</span>
              <small>{hint}</small>
            </>
          )}
        </label>
      ) : (
        <LinkInput onSubmit={onChange} />
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

function LinkInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [v, setV] = useState("");
  const ok = /^https:\/\/\S+\.\S+/.test(v.trim());
  return (
    <div className={styles.linkRow}>
      <label className={ui.field}>
        <input value={v} placeholder="https://…/image.gif" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ok && onSubmit(v.trim())} />
      </label>
      <button type="button" className={ui.secondary} disabled={!ok} onClick={() => onSubmit(v.trim())}>
        Use
      </button>
    </div>
  );
}
