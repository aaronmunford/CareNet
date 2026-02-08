"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    Heart,
    AlertCircle,
    Pill,
    FileText,
    Upload,
    X,
    Check,
    ArrowLeft,
    Download,
    Trash2,
    FileImage,
    File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile, MedicalDocument } from "@/lib/types";
import { DEFAULT_USER_PROFILE, BLOOD_TYPES } from "@/lib/types";

const ACCEPTED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
    if (type.startsWith("image/")) {
        return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (type === "application/pdf") {
        return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-slate-500" />;
}

export function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem("caremap-user-profile");
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                // Ensure medicalDocuments array exists (for backward compatibility)
                if (!parsed.medicalDocuments) {
                    parsed.medicalDocuments = [];
                }
                setProfile(parsed);
            } catch (e) {
                console.error("Failed to parse saved profile");
            }
        }
    }, []);

    const handleSave = useCallback(() => {
        setIsSaving(true);
        setSaveSuccess(false);

        // Simulate a slight delay for UX
        setTimeout(() => {
            localStorage.setItem("caremap-user-profile", JSON.stringify(profile));
            setIsSaving(false);
            setSaveSuccess(true);

            // Reset success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 500);
    }, [profile]);

    const handleFileUpload = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            setUploadError(null);

            const newDocuments: MedicalDocument[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                    setUploadError(
                        `"${file.name}" is not a supported file type. Please upload PDF, images, or Word documents.`
                    );
                    continue;
                }

                // Validate file size
                if (file.size > MAX_FILE_SIZE) {
                    setUploadError(
                        `"${file.name}" is too large. Maximum file size is 5MB.`
                    );
                    continue;
                }

                // Convert to base64
                try {
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    newDocuments.push({
                        id: crypto.randomUUID(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        uploadedAt: new Date().toISOString(),
                        dataUrl,
                    });
                } catch (e) {
                    setUploadError(`Failed to read "${file.name}". Please try again.`);
                }
            }

            if (newDocuments.length > 0) {
                setProfile((prev) => ({
                    ...prev,
                    medicalDocuments: [...prev.medicalDocuments, ...newDocuments],
                }));
            }
        },
        []
    );

    const handleDeleteDocument = useCallback((id: string) => {
        setProfile((prev) => ({
            ...prev,
            medicalDocuments: prev.medicalDocuments.filter((doc) => doc.id !== id),
        }));
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
        },
        [handleFileUpload]
    );

    const updateField = <K extends keyof UserProfile>(
        field: K,
        value: UserProfile[K]
    ) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto max-w-4xl px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="font-medium">Back to CareNet</span>
                        </Link>

                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : saveSuccess ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Save Profile
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                    <p className="mt-2 text-slate-600">
                        Manage your personal information and medical history
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Your basic contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={profile.firstName}
                                        onChange={(e) => updateField("firstName", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        value={profile.lastName}
                                        onChange={(e) => updateField("lastName", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={profile.email}
                                        onChange={(e) => updateField("email", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        value={profile.phone}
                                        onChange={(e) => updateField("phone", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth" className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Date of Birth
                                    </Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={profile.dateOfBirth}
                                        onChange={(e) => updateField("dateOfBirth", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Address
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="123 Main St, New York, NY"
                                        value={profile.address}
                                        onChange={(e) => updateField("address", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-red-500" />
                                Emergency Contact
                            </CardTitle>
                            <CardDescription>
                                Who should we contact in case of emergency?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emergencyName">Name</Label>
                                    <Input
                                        id="emergencyName"
                                        placeholder="Jane Doe"
                                        value={profile.emergencyContactName}
                                        onChange={(e) =>
                                            updateField("emergencyContactName", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergencyPhone">Phone</Label>
                                    <Input
                                        id="emergencyPhone"
                                        type="tel"
                                        placeholder="(555) 987-6543"
                                        value={profile.emergencyContactPhone}
                                        onChange={(e) =>
                                            updateField("emergencyContactPhone", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergencyRelation">Relationship</Label>
                                    <Input
                                        id="emergencyRelation"
                                        placeholder="Spouse, Parent, etc."
                                        value={profile.emergencyContactRelation}
                                        onChange={(e) =>
                                            updateField("emergencyContactRelation", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-pink-500" />
                                Medical Information
                            </CardTitle>
                            <CardDescription>
                                Important medical details for healthcare providers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bloodType">Blood Type</Label>
                                    <Select
                                        value={profile.bloodType}
                                        onValueChange={(value) => updateField("bloodType", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select blood type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BLOOD_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="allergies" className="flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                                    Allergies
                                </Label>
                                <Textarea
                                    id="allergies"
                                    placeholder="List any allergies (medications, food, environmental)..."
                                    value={profile.allergies}
                                    onChange={(e) => updateField("allergies", e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="conditions">Medical Conditions</Label>
                                <Textarea
                                    id="conditions"
                                    placeholder="List any chronic conditions or diagnoses..."
                                    value={profile.medicalConditions}
                                    onChange={(e) =>
                                        updateField("medicalConditions", e.target.value)
                                    }
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medications" className="flex items-center gap-1">
                                    <Pill className="h-3.5 w-3.5 text-purple-500" />
                                    Current Medications
                                </Label>
                                <Textarea
                                    id="medications"
                                    placeholder="List medications you're currently taking..."
                                    value={profile.medications}
                                    onChange={(e) => updateField("medications", e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical History Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-500" />
                                Medical History Documents
                            </CardTitle>
                            <CardDescription>
                                Upload medical records, test results, prescriptions, or other
                                health documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Upload Area */}
                            <div
                                className={cn(
                                    "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                                    isDragging
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPTED_FILE_TYPES.join(",")}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />

                                <Upload
                                    className={cn(
                                        "mx-auto h-12 w-12 mb-4",
                                        isDragging ? "text-blue-500" : "text-slate-400"
                                    )}
                                />

                                <p className="text-sm font-medium text-slate-700">
                                    Drag and drop files here, or{" "}
                                    <button
                                        type="button"
                                        className="text-blue-600 hover:text-blue-700 underline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    PDF, images, or Word documents up to 5MB each
                                </p>
                            </div>

                            {/* Upload Error */}
                            {uploadError && (
                                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {uploadError}
                                </div>
                            )}

                            {/* Uploaded Documents List */}
                            {profile.medicalDocuments.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Uploaded Documents ({profile.medicalDocuments.length})
                                    </Label>
                                    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                                        {profile.medicalDocuments.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between gap-4 p-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {getFileIcon(doc.type)}
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-slate-900">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatFileSize(doc.size)} •{" "}
                                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={doc.dataUrl}
                                                        download={doc.name}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                How would you like to receive updates?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="notifyEmail" className="cursor-pointer">
                                        Email Notifications
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        Receive appointment reminders via email
                                    </p>
                                </div>
                                <Switch
                                    id="notifyEmail"
                                    checked={profile.notifyEmail}
                                    onCheckedChange={(checked) =>
                                        updateField("notifyEmail", checked)
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="notifySms" className="cursor-pointer">
                                        SMS Notifications
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        Receive text message reminders
                                    </p>
                                </div>
                                <Switch
                                    id="notifySms"
                                    checked={profile.notifySms}
                                    onCheckedChange={(checked) =>
                                        updateField("notifySms", checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Floating Save Button (Mobile) */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="lg"
                        className="gap-2 shadow-lg"
                    >
                        {isSaving ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Saving...
                            </>
                        ) : saveSuccess ? (
                            <>
                                <Check className="h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
