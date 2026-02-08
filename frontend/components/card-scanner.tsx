import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, Check, AlertCircle } from "lucide-react";
import type { InsuranceInfo, InsuranceProvider, PlanType } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";
import { useCallback, useRef, useState, useEffect } from "react";
import { analyzeFrame, createStabilityDetector } from "@/lib/camera-utils";

interface CardScannerProps {
  onExtracted: (data: Partial<InsuranceInfo> & { patientName?: string; dateOfBirth?: string }) => void;
}

type ScanState = "idle" | "capturing" | "preview" | "scanning" | "success" | "error";

export function CardScanner({ onExtracted }: CardScannerProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<ScanState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [qualityScore, setQualityScore] = useState(0);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [extractedInfo, setExtractedInfo] = useState<{ patientName?: string; dateOfBirth?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stabilityDetectorRef = useRef(createStabilityDetector());
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    stabilityDetectorRef.current.reset();
    setQualityScore(0);
    setStabilityProgress(0);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setState("capturing");
      setErrorMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setState("idle");
      setErrorMessage("Could not access camera. Try uploading instead.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
    setState("preview");
  }, [stopCamera]);

  // Auto-capture analysis loop
  useEffect(() => {
    if (state !== "capturing") return;

    let lastAnalysisTime = 0;
    const ANALYSIS_INTERVAL = 100; // Analyze at ~10fps

    const analyzeLoop = (timestamp: number) => {
      if (timestamp - lastAnalysisTime >= ANALYSIS_INTERVAL) {
        lastAnalysisTime = timestamp;

        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
          const video = videoRef.current;
          const canvas = canvasRef.current;

          // Draw current frame to canvas for analysis
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const analysis = analyzeFrame(canvas);
            const score = stabilityDetectorRef.current.getQualityScore(analysis);
            const progress = stabilityDetectorRef.current.getStabilityProgress();
            setQualityScore(score);
            setStabilityProgress(progress);

            // Check if we should auto-capture
            if (stabilityDetectorRef.current.addFrame(analysis)) {
              // Auto-capture triggered!
              setPreview(canvas.toDataURL("image/jpeg", 0.8));
              stopCamera();
              setState("preview");
              return; // Exit the loop
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(analyzeLoop);
    };

    animationFrameRef.current = requestAnimationFrame(analyzeLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state, stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setState("preview");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const scanCard = useCallback(async () => {
    if (!preview) return;
    setState("scanning");
    setErrorMessage("");
    try {
      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      if (!res.ok) throw new Error("Scan failed");
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      const extracted: Partial<InsuranceInfo> & { patientName?: string; dateOfBirth?: string } = {};
      if (data.provider) extracted.provider = data.provider as InsuranceProvider;
      if (data.planType) extracted.planType = data.planType as PlanType;
      if (data.networkName) extracted.networkName = data.networkName;
      if (data.memberZip) extracted.memberZip = data.memberZip;
      if (data.patientName) extracted.patientName = data.patientName;
      if (data.dateOfBirth) extracted.dateOfBirth = data.dateOfBirth;
      setExtractedInfo({ patientName: data.patientName, dateOfBirth: data.dateOfBirth });
      setState("success");
      onExtracted(extracted);
      setTimeout(() => { setState("idle"); setPreview(null); setExtractedInfo(null); }, 3000);
    } catch {
      setState("error");
      setErrorMessage("Could not read the card. Try again or enter info manually.");
    }
  }, [preview, onExtracted]);

  const reset = useCallback(() => {
    stopCamera();
    setState("idle");
    setPreview(null);
    setErrorMessage("");
    setExtractedInfo(null);
  }, [stopCamera]);

  if (state === "idle") {
    return (
      <div className="rounded-lg border border-dashed px-5 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t("insurance.scan_title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("insurance.scan_subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-transparent" onClick={startCamera}>
              <Camera className="h-3.5 w-3.5" />
              {t("insurance.photo_btn")}
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-transparent" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              {t("insurance.upload_btn")}
            </Button>
          </div>
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload insurance card"
        />
      </div>
    );
  }

  if (state === "capturing") {
    const isStable = qualityScore >= 80 && stabilityProgress >= 60;
    const qualityColor = qualityScore >= 80 ? "text-green-500" : qualityScore >= 50 ? "text-yellow-500" : "text-muted-foreground";
    const strokeDasharray = `${(stabilityProgress / 100) * 100} 100`;

    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="relative aspect-video bg-foreground/5">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Animated scanning frame */}
          <div className="pointer-events-none absolute inset-12 sm:inset-16">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="scanGradient" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="40%" stopColor="transparent" />
                  <stop offset="50%" stopColor="rgba(34, 197, 94, 0.95)" />
                  <stop offset="60%" stopColor="transparent" />
                  <stop offset="100%" stopColor="transparent" />
                  {isStable && (
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 50 50"
                      to="360 50 50"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </linearGradient>
              </defs>
              {/* Base frame */}
              <rect
                x="1" y="1" width="98" height="98"
                rx="8" ry="8"
                fill="none"
                stroke={isStable ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.3)"}
                strokeWidth="0.5"
                className="transition-all duration-300"
              />
              {/* Animated highlight - only visible when holding steady */}
              {isStable && (
                <rect
                  x="1" y="1" width="98" height="98"
                  rx="8" ry="8"
                  fill="none"
                  stroke="url(#scanGradient)"
                  strokeWidth="2"
                />
              )}
            </svg>
          </div>

          {/* Quality indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5">
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                className={`${qualityColor} transition-all duration-200`}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                style={{ stroke: "currentColor" }}
              />
            </svg>
            <span className="text-xs font-medium">
              {isStable ? "Capturing..." : "Hold steady"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={capturePhoto}>
            Capture
          </Button>
        </div>
      </div>
    );
  }

  if (state === "preview" || state === "scanning") {
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="relative aspect-video bg-muted">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview || "/placeholder.svg"} alt="Insurance card" className="h-full w-full object-contain" />
          )}
          {state === "scanning" && (
            <>
              {/* Scanning overlay with animated edge highlights */}
              <div className="absolute inset-0 bg-foreground/30">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    {/* Animated gradient for the scanning line */}
                    <linearGradient id="scanLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                      <stop offset="50%" stopColor="rgba(59, 130, 246, 1)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                    </linearGradient>
                  </defs>

                  {/* Outer scanning frame */}
                  <rect
                    x="2" y="2" width="96" height="96"
                    rx="4" ry="4"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="0.5"
                  />

                  {/* Animated corner highlights */}
                  {/* Top left corner */}
                  <path d="M 2 6 L 2 2 L 6 2" fill="none" stroke="rgba(59, 130, 246, 1)" strokeWidth="1.5" strokeLinecap="round">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                  </path>
                  {/* Top right corner */}
                  <path d="M 94 2 L 98 2 L 98 6" fill="none" stroke="rgba(59, 130, 246, 1)" strokeWidth="1.5" strokeLinecap="round">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                  </path>
                  {/* Bottom right corner */}
                  <path d="M 98 94 L 98 98 L 94 98" fill="none" stroke="rgba(59, 130, 246, 1)" strokeWidth="1.5" strokeLinecap="round">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                  </path>
                  {/* Bottom left corner */}
                  <path d="M 6 98 L 2 98 L 2 94" fill="none" stroke="rgba(59, 130, 246, 1)" strokeWidth="1.5" strokeLinecap="round">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                  </path>

                  {/* Scanning line that moves around the perimeter */}
                  <path
                    d="M 2 2 L 98 2 L 98 98 L 2 98 L 2 2"
                    fill="none"
                    stroke="url(#scanLineGradient)"
                    strokeWidth="2"
                    strokeDasharray="8 284"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="292"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>

              {/* Center loading indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-20" />
                </div>
                <p className="text-sm font-medium text-white drop-shadow-lg">Analyzing card...</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset} disabled={state === "scanning"}>
            Retake
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={scanCard} disabled={state === "scanning"}>
            {state === "scanning" ? (
              <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Scanning</>
            ) : "Use photo"}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Check className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
          <p className="text-sm font-medium">Card scanned successfully!</p>
        </div>
        {extractedInfo && (extractedInfo.patientName || extractedInfo.dateOfBirth) && (
          <div className="ml-6 flex flex-col gap-1 text-xs text-muted-foreground">
            {extractedInfo.patientName && <p>Patient: {extractedInfo.patientName}</p>}
            {extractedInfo.dateOfBirth && <p>DOB: {extractedInfo.dateOfBirth}</p>}
          </div>
        )}
        <p className="ml-6 text-xs text-muted-foreground">Review the fields below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">Scan failed</p>
      </div>
      <p className="text-xs text-muted-foreground">{errorMessage}</p>
      <Button variant="outline" size="sm" className="w-fit h-7 text-xs bg-transparent" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
