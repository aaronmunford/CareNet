"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react";
import type { Hospital } from "@/lib/types";

interface PaymentModalProps {
    hospital: Hospital | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function PaymentModal({ hospital, isOpen, onClose, onSuccess }: PaymentModalProps) {
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [name, setName] = useState("");

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(" ") : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4);
        }
        return v;
    };

    const handlePayment = async () => {
        setStatus("processing");

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setStatus("success");

        // Auto-close after success
        setTimeout(() => {
            onSuccess?.();
            handleClose();
        }, 1500);
    };

    const handleClose = () => {
        setStatus("idle");
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setName("");
        onClose();
    };

    const isFormValid = cardNumber.replace(/\s/g, "").length >= 15 && expiry.length >= 4 && cvc.length >= 3;

    if (status === "success") {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Your appointment at {hospital?.name} has been confirmed.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Secure Payment
                    </DialogTitle>
                    <DialogDescription>
                        Pay the $50 copay to secure your spot at {hospital?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Card Preview */}
                    <div className="relative h-44 w-full rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-5 text-white shadow-xl">
                        <div className="absolute right-5 top-5 text-xs font-medium opacity-80">VISA</div>
                        <div className="absolute bottom-16 left-5 font-mono text-lg tracking-widest">
                            {cardNumber || "•••• •••• •••• ••••"}
                        </div>
                        <div className="absolute bottom-5 left-5 text-xs opacity-80">
                            <div className="mb-1 text-[10px] uppercase tracking-wider">Card Holder</div>
                            <div className="font-medium">{name || "YOUR NAME"}</div>
                        </div>
                        <div className="absolute bottom-5 right-5 text-xs opacity-80">
                            <div className="mb-1 text-[10px] uppercase tracking-wider">Expires</div>
                            <div className="font-medium">{expiry || "MM/YY"}</div>
                        </div>
                    </div>

                    {/* Card Form */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="cardNumber" className="text-xs">Card Number</Label>
                            <Input
                                id="cardNumber"
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                                className="font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs">Cardholder Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="expiry" className="text-xs">Expiry Date</Label>
                                <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                    maxLength={5}
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cvc" className="text-xs">CVC</Label>
                                <Input
                                    id="cvc"
                                    type="password"
                                    placeholder="•••"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    maxLength={4}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs text-slate-500">
                        <Lock className="h-3 w-3" />
                        Secured by Flowglad & Stripe
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={status === "processing"}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={!isFormValid || status === "processing"}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {status === "processing" ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>Pay $50.00</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
