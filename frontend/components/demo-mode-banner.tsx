"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface DemoModeBannerProps {
  feature: "card-scan" | "voice-triage";
}

export function DemoModeBanner({ feature }: DemoModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const messages = {
    "card-scan": "Using demo mode for card scanning. Sample data will be shown.",
    "voice-triage": "Using demo mode for voice triage. Basic keyword matching will be used.",
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-blue-900">
          <strong>Demo Mode:</strong> {messages[feature]}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          All other features work normally. This doesn't affect your results.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-blue-100"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3.5 w-3.5 text-blue-600" />
      </Button>
    </div>
  );
}
