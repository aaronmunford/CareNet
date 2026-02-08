"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { Bill, PaymentMethod, BillStatus } from "@/lib/types";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  Trash2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_BRAND_ICONS = {
  visa: "/card-visa.svg",
  mastercard: "/card-mastercard.svg",
  amex: "/card-amex.svg",
  discover: "/card-discover.svg",
};

export function BillingCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"bills" | "payment-methods">("bills");
  const [bills, setBills] = useState<Bill[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showPayBillDialog, setShowPayBillDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    // Load bills and payment methods from localStorage
    const storedBills = localStorage.getItem("carenet_bills");
    const storedPaymentMethods = localStorage.getItem("carenet_payment_methods");

    if (storedBills) {
      setBills(JSON.parse(storedBills));
    } else {
      // Demo data
      const demoBills: Bill[] = [
        {
          id: "bill_1",
          hospitalId: "1",
          hospitalName: "NYU Langone Health",
          date: "2026-02-01T10:00:00",
          dueDate: "2026-03-01T10:00:00",
          amount: 250,
          status: "pending",
          description: "Urgent Care Visit",
          serviceDate: "2026-01-15T14:30:00",
          insuranceCovered: 150,
        },
        {
          id: "bill_2",
          hospitalId: "2",
          hospitalName: "Mount Sinai Hospital",
          date: "2026-01-10T09:00:00",
          dueDate: "2026-02-10T09:00:00",
          amount: 75,
          status: "paid",
          description: "Dental Cleaning",
          serviceDate: "2026-01-08T11:00:00",
          paidDate: "2026-01-15T16:20:00",
          paymentMethodId: "pm_1",
        },
      ];
      setBills(demoBills);
      localStorage.setItem("carenet_bills", JSON.stringify(demoBills));
    }

    if (storedPaymentMethods) {
      setPaymentMethods(JSON.parse(storedPaymentMethods));
    } else {
      // Demo data
      const demoPaymentMethods: PaymentMethod[] = [
        {
          id: "pm_1",
          type: "credit_card",
          lastFour: "4242",
          cardBrand: "visa",
          expiryMonth: "12",
          expiryYear: "2028",
          isDefault: true,
          billingAddress: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            zip: "10001",
          },
        },
      ];
      setPaymentMethods(demoPaymentMethods);
      localStorage.setItem("carenet_payment_methods", JSON.stringify(demoPaymentMethods));
    }
  }, []);

  const totalPending = bills
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPayBillDialog(true);
  };

  const confirmPayment = () => {
    if (!selectedBill) return;

    const updatedBills = bills.map((b) =>
      b.id === selectedBill.id
        ? { ...b, status: "paid" as BillStatus, paidDate: new Date().toISOString() }
        : b
    );
    setBills(updatedBills);
    localStorage.setItem("carenet_bills", JSON.stringify(updatedBills));
    setShowPayBillDialog(false);
    setSelectedBill(null);
  };

  const getBillStatusColor = (status: BillStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
    }
  };

  const getBillStatusIcon = (status: BillStatus) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing Center</h1>
        <p className="text-muted-foreground">Manage your bills and payment methods</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Bills</p>
              <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Methods</p>
              <p className="text-2xl font-bold">{paymentMethods.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("bills")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "bills"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Bills ({bills.length})
        </button>
        <button
          onClick={() => setActiveTab("payment-methods")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "payment-methods"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Payment Methods ({paymentMethods.length})
        </button>
      </div>

      {/* Bills Tab */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          {bills.length === 0 ? (
            <Card className="p-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No bills yet</h3>
              <p className="text-sm text-muted-foreground">Your bills will appear here</p>
            </Card>
          ) : (
            bills.map((bill) => (
              <Card key={bill.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{bill.hospitalName}</h3>
                          <Badge className={cn("gap-1", getBillStatusColor(bill.status))}>
                            {getBillStatusIcon(bill.status)}
                            {bill.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{bill.description}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Service Date: {new Date(bill.serviceDate).toLocaleDateString()}</span>
                          <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                          {bill.insuranceCovered && (
                            <span>Insurance Covered: ${bill.insuranceCovered.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold">${bill.amount.toFixed(2)}</p>
                      {bill.paidDate && (
                        <p className="text-xs text-muted-foreground">
                          Paid {new Date(bill.paidDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {bill.status === "pending" && (
                      <Button onClick={() => handlePayBill(bill)} size="sm" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                    {bill.status === "paid" && bill.receiptUrl && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "payment-methods" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Saved Payment Methods</h2>
            <Button onClick={() => setShowAddPaymentDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
          {paymentMethods.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payment methods</h3>
              <p className="text-sm text-muted-foreground">Add a payment method to pay bills quickly</p>
              <Button onClick={() => setShowAddPaymentDialog(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Payment Method
              </Button>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {method.cardBrand ? method.cardBrand.toUpperCase() : method.type.replace("_", " ")} ••••{" "}
                          {method.lastFour}
                        </p>
                        {method.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {method.billingAddress.city}, {method.billingAddress.state} {method.billingAddress.zip}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pay Bill Dialog */}
      <Dialog open={showPayBillDialog} onOpenChange={setShowPayBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
            <DialogDescription>Confirm payment for this bill</DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="font-semibold">{selectedBill.hospitalName}</p>
                <p className="text-sm text-muted-foreground">{selectedBill.description}</p>
                <p className="mt-2 text-2xl font-bold">${selectedBill.amount.toFixed(2)}</p>
              </div>
              {paymentMethods.length > 0 ? (
                <>
                  <div>
                    <Label>Payment Method</Label>
                    <div className="mt-2 rounded-lg border p-3">
                      {paymentMethods.find((m) => m.isDefault) && (
                        <p className="text-sm">
                          {paymentMethods.find((m) => m.isDefault)?.cardBrand?.toUpperCase()} ••••{" "}
                          {paymentMethods.find((m) => m.isDefault)?.lastFour}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={confirmPayment} className="flex-1">
                      Confirm Payment
                    </Button>
                    <Button variant="outline" onClick={() => setShowPayBillDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  <p>No payment methods available</p>
                  <Button onClick={() => setShowAddPaymentDialog(true)} className="mt-4">
                    Add Payment Method
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddPaymentDialog}
        onOpenChange={setShowAddPaymentDialog}
        onAdd={(method) => {
          const updatedMethods = [...paymentMethods, method];
          setPaymentMethods(updatedMethods);
          localStorage.setItem("carenet_payment_methods", JSON.stringify(updatedMethods));
        }}
      />
    </div>
  );
}

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (method: PaymentMethod) => void;
}

function AddPaymentMethodDialog({ open, onOpenChange, onAdd }: AddPaymentMethodDialogProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lastFour = cardNumber.slice(-4);
    let cardBrand: "visa" | "mastercard" | "amex" | "discover" = "visa";
    if (cardNumber.startsWith("5")) cardBrand = "mastercard";
    else if (cardNumber.startsWith("3")) cardBrand = "amex";
    else if (cardNumber.startsWith("6")) cardBrand = "discover";

    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type: "credit_card",
      lastFour,
      cardBrand,
      expiryMonth,
      expiryYear,
      isDefault: false,
      billingAddress: {
        street,
        city,
        state,
        zip,
      },
    };

    onAdd(newMethod);
    onOpenChange(false);
    // Reset form
    setCardNumber("");
    setExpiryMonth("");
    setExpiryYear("");
    setCvv("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>Add a new credit or debit card</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="1234 5678 9012 3456"
              maxLength={16}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                placeholder="MM"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                placeholder="YYYY"
                maxLength={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="street">Billing Address</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Main St"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" required />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="10001" required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add Card
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
