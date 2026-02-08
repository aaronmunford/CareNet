"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hospital } from "@/lib/types";
import { Clock, Zap, Calendar as CalendarIcon } from "lucide-react";

interface BookingTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital: Hospital;
  onConfirm: (timePreference: "asap" | "today" | "tomorrow" | "this-week") => void;
}

export function BookingTimeDialog({ open, onOpenChange, hospital, onConfirm }: BookingTimeDialogProps) {
  const [selectedTime, setSelectedTime] = useState<"asap" | "today" | "tomorrow" | "this-week">("asap");

  const handleConfirm = () => {
    onConfirm(selectedTime);
  };

  const timeOptions = [
    {
      value: "asap" as const,
      label: "ASAP",
      description: "Next available appointment (within 1-3 hours)",
      icon: Zap,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      value: "today" as const,
      label: "Today",
      description: "Schedule for later today",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      value: "tomorrow" as const,
      label: "Tomorrow",
      description: "Schedule for tomorrow",
      icon: CalendarIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      value: "this-week" as const,
      label: "This Week",
      description: "Schedule within the next 7 days",
      icon: CalendarIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>When would you like your appointment?</DialogTitle>
          <DialogDescription>
            Our CareNet agent will book an appointment at {hospital.name} based on your preference.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {timeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedTime === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedTime(option.value)}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-2`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? option.bgColor : "bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? option.color : "text-slate-600"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isSelected ? option.color : "text-slate-900"}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-current">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirm & Book
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
