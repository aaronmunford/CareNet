"use client";
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";

// Mock data type - keep consistent with backend
interface Appointment {
    id: string;
    hospitalName: string;
    date: string;
    status: string;
    notes?: string;
    transcript?: string;
    audioUrl?: string;
}

export function CalendarView() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetch("http://localhost:8000/appointments");
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedDateAppointments = appointments.filter((appt) => {
        if (!date) return false;
        const apptDate = new Date(appt.date);
        return (
            apptDate.getDate() === date.getDate() &&
            apptDate.getMonth() === date.getMonth() &&
            apptDate.getFullYear() === date.getFullYear()
        );
    });

    const upcomingAppointments = appointments
        .filter((a) => new Date(a.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const addToGoogleCalendar = (appt: Appointment) => {
        const startDate = new Date(appt.date);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
        const text = encodeURIComponent(`Appointment at ${appt.hospitalName}`);
        const dates = `${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
        const details = encodeURIComponent(appt.notes || "Medical Appointment");
        const location = encodeURIComponent(appt.hospitalName);

        window.open(
            `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`,
            "_blank"
        );
    };

    const downloadIcs = (appt: Appointment) => {
        const startDate = new Date(appt.date);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}
DTEND:${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}
SUMMARY:Appointment at ${appt.hospitalName}
DESCRIPTION:${appt.notes || "Medical Appointment"}
LOCATION:${appt.hospitalName}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `appointment-${appt.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
            {/* Sidebar - Upcoming List */}
            <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Upcoming
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <p className="text-sm text-slate-500 text-center py-4">Loading appointments...</p>
                            ) : upcomingAppointments.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No upcoming appointments</p>
                            ) : (
                                upcomingAppointments.map((appt) => (
                                    <div key={appt.id} className="group flex flex-col gap-2 p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                                        onClick={() => setDate(new Date(appt.date))}>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-slate-900 line-clamp-1">{appt.hospitalName}</h4>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 h-5">
                                                Confirmed
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {format(new Date(appt.date), "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {format(new Date(appt.date), "h:mm a")}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Main Content - Calendar & Details */}
            <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm p-4 flex items-center justify-center bg-white">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border-0"
                            modifiers={{
                                booked: (date) => appointments.some(a => {
                                    const d = new Date(a.date);
                                    return d.getDate() === date.getDate() &&
                                        d.getMonth() === date.getMonth() &&
                                        d.getFullYear() === date.getFullYear();
                                })
                            }}
                            modifiersStyles={{
                                booked: { fontWeight: 'bold', color: 'var(--blue-600)', textDecoration: 'underline' }
                            }}
                        />
                    </Card>

                    <Card className="border-slate-200 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{date ? format(date, "MMMM d, yyyy") : "Select a date"}</span>
                                {selectedDateAppointments.length > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                                        {selectedDateAppointments.length} Appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {selectedDateAppointments.length === 0
                                    ? "No appointments scheduled for this day."
                                    : "Your scheduled visits"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {selectedDateAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDateAppointments.map(appt => (
                                        <div key={appt.id} className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-slate-900">{appt.hospitalName}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                        <Clock className="w-4 h-4" />
                                                        {format(new Date(appt.date), "h:mm a")}
                                                    </div>
                                                </div>
                                            </div>

                                            {appt.notes && (
                                                <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100 italic">
                                                    "{appt.notes}"
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => addToGoogleCalendar(appt)}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Google Calendar
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => downloadIcs(appt)}>
                                                    <Download className="w-3.5 h-3.5" />
                                                    Apple Calendar (.ics)
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[200px]">
                                    <CalendarIcon className="w-12 h-12 opacity-20" />
                                    <p>No appointments</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
