"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

function stopVideo(video: HTMLVideoElement | null) {
  try {
    if (!video) return;
    const stream = video.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    video.srcObject = null;
  } catch {
    // ignore
  }
}

export default function MobileBarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    const start = async () => {
      setErr("");
      try {
        if (!videoRef.current) return;

        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              cancelled = true;

              // stop camera cleanly
              stopVideo(videoRef.current);

              onClose();
              onDetected(text);
            }
          }
        );
      } catch (e: any) {
        setErr(e?.message ?? "Camera scanning failed.");
      }
    };

    start();

    return () => {
      cancelled = true;
      stopVideo(videoRef.current);
    };
  }, [open, onClose, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={() => {
          stopVideo(videoRef.current);
          onClose();
        }}
        aria-label="Close scanner"
      />

      <div className="relative w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scan barcode</h2>
          <button
            className="rounded-lg border px-3 py-1 text-sm"
            onClick={() => {
              stopVideo(videoRef.current);
              onClose();
            }}
          >
            Close
          </button>
        </div>

        {err ? (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        ) : (
          <p className="mb-3 text-xs text-gray-600">
            Point your camera at the barcode. Good lighting helps.
          </p>
        )}

        <video ref={videoRef} className="w-full rounded-lg bg-black" />
      </div>
    </div>
  );
}
