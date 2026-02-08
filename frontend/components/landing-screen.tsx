"use client";

import React from "react"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  ArrowRight,
  MapPin,
  Shield,
  DollarSign,
  Clock,
  Activity,
  Phone,
  Zap,
  Heart,
  CheckCircle2,
  Stethoscope,
  Navigation,
  Star,
  Building2,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingScreenProps {
  onStart: () => void;
}

function RevealSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: Navigation,
    title: "Real-time distance",
    description:
      "Hospitals ranked by proximity with estimated drive times across every Manhattan neighborhood.",
    stat: "8 hospitals",
    color: "text-teal-600",
    bg: "bg-teal-50",
    borderColor: "border-teal-100",
  },
  {
    icon: Shield,
    title: "Insurance verification",
    description:
      "See whether each hospital is verified, likely, or unknown for your specific insurance plan.",
    stat: "3 confidence levels",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    icon: DollarSign,
    title: "Cost transparency",
    description:
      "Estimated out-of-pocket ranges so you know what to expect before you arrive.",
    stat: "Real estimates",
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderColor: "border-amber-100",
  },
];

const HOSPITALS_PREVIEW = [
  { name: "NYP / Weill Cornell", distance: "0.8 mi", trauma: "Level I", confidence: "Verified" },
  { name: "Mount Sinai Hospital", distance: "1.2 mi", trauma: "Level I", confidence: "Verified" },
  { name: "NYU Langone Tisch", distance: "1.5 mi", trauma: "Level I", confidence: "Likely" },
  { name: "Bellevue Hospital", distance: "1.7 mi", trauma: "Level I", confidence: "Verified" },
];

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 shadow-md shadow-teal-600/20">
              <Stethoscope className="h-5 w-5 text-white" strokeWidth={2} />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-foreground">
                Hospital Finder
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Manhattan
              </span>
            </div>
          </div>
          <a
            href="tel:911"
            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
          >
            <Phone className="h-3.5 w-3.5" />
            Emergency: 911
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(13,148,136,0.08),transparent)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 lg:flex-row lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="flex flex-1 flex-col gap-8">
            <RevealSection>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered insurance card scanning
              </div>
            </RevealSection>

            <RevealSection delay={100}>
              <h1 className="text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem] lg:leading-[1.08]">
                Find the right
                <br />
                <span className="text-teal-600">hospital</span>, right now.
              </h1>
            </RevealSection>

            <RevealSection delay={200}>
              <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Enter your insurance and describe your situation. We instantly
                match you with nearby Manhattan hospitals ranked by distance,
                capability, and estimated cost.
              </p>
            </RevealSection>

            <RevealSection delay={300}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="group h-14 rounded-2xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-xl shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-2xl hover:shadow-teal-600/30 active:scale-[0.98]"
                  onClick={onStart}
                >
                  Get started
                  <ArrowRight className="ml-2 h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Takes about 2 minutes
                </span>
              </div>
            </RevealSection>

            <RevealSection delay={400}>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                {[
                  "8 major hospitals",
                  "Verified insurance data",
                  "All Level I trauma centers",
                  "Real-time estimates",
                ].map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-2 text-[13px] text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                    {point}
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>

          {/* Hero image */}
          <RevealSection className="relative flex-1 lg:max-w-[480px]" delay={200}>
            <div className="overflow-hidden rounded-3xl shadow-2xl shadow-foreground/8">
              <Image
                src="/images/hero-doctor.jpg"
                alt="Doctor having a warm consultation with a patient in a modern hospital"
                width={600}
                height={400}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            {/* Floating glass cards */}
            <div className="glass absolute -bottom-5 -left-3 rounded-2xl px-4 py-3.5 shadow-lg sm:-left-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Heart className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">8 hospitals</p>
                  <p className="text-[11px] text-muted-foreground">Across Manhattan</p>
                </div>
              </div>
            </div>
            <div className="glass absolute -right-2 top-6 rounded-2xl px-4 py-3 shadow-lg sm:-right-4">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-foreground">
                  Real-time data
                </span>
              </div>
            </div>
            <div className="glass absolute -right-1 bottom-12 rounded-2xl px-4 py-3 shadow-lg sm:-right-5">
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">
                  AI card scanning
                </span>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-4 divide-x px-6">
          {[
            { icon: Building2, value: "8", label: "Hospitals", sub: "covered" },
            { icon: Activity, value: "3", label: "Trauma I", sub: "centers" },
            { icon: Clock, value: "<20", label: "Min avg", sub: "ETA" },
            { icon: Users, value: "24/7", label: "Always", sub: "available" },
          ].map((stat) => (
            <RevealSection key={stat.label} className="flex flex-col items-center gap-2 py-8 sm:py-10">
              <stat.icon className="h-5 w-5 text-teal-500" />
              <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                {stat.value}
              </span>
              <div className="text-center">
                <span className="text-xs font-medium text-foreground">{stat.label}</span>
                <span className="ml-1 text-xs text-muted-foreground">{stat.sub}</span>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection>
            <div className="mb-12 flex flex-col gap-3 text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to decide
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
                We surface the three most critical factors so you can make an
                informed choice, even under pressure.
              </p>
            </div>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <RevealSection key={feature.title} delay={i * 120}>
                <div
                  className={cn(
                    "group flex h-full flex-col gap-5 overflow-hidden rounded-2xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                    feature.borderColor
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl",
                        feature.bg
                      )}
                    >
                      <feature.icon className={cn("h-7 w-7", feature.color)} />
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold",
                        feature.bg,
                        feature.color
                      )}
                    >
                      {feature.stat}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital preview list */}
      <section className="border-y bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
            <RevealSection className="flex flex-1 flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600">
                <MapPin className="h-3 w-3" />
                Live hospital data
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Manhattan{"'"}s top hospitals, one search away
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Our database covers every major hospital in Manhattan including
                all Level I trauma centers, stroke centers, burn units, and
                pediatric emergency departments.
              </p>
              <div className="flex flex-col gap-2">
                {HOSPITALS_PREVIEW.map((h, i) => (
                  <RevealSection key={h.name} delay={i * 80}>
                    <div className="flex items-center gap-4 rounded-xl border bg-background px-4 py-3 transition-all hover:shadow-md">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {h.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.distance} &middot; {h.trauma}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          h.confidence === "Verified"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        )}
                      >
                        {h.confidence}
                      </span>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>

            <RevealSection className="flex-1" delay={200}>
              <div className="overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/images/hospital-exterior.jpg"
                  alt="Modern Manhattan hospital exterior at golden hour"
                  width={600}
                  height={400}
                  className="h-auto w-full object-cover"
                />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three steps to the right care
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              A guided process designed for moments when time matters.
            </p>
          </RevealSection>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Shield,
                title: "Enter your insurance",
                desc: "Select your provider and plan, or snap a photo of your card and let AI extract the details automatically.",
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                step: "02",
                icon: Activity,
                title: "Describe your situation",
                desc: "Choose care type, select symptoms, and indicate severity. This helps us match hospital capabilities to your needs.",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                step: "03",
                icon: MapPin,
                title: "Get matched results",
                desc: "View hospitals on an interactive map ranked by distance, insurance fit, and cost. Tap for details, call, or get directions.",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((item, i) => (
              <RevealSection key={item.step} delay={i * 120}>
                <div className="flex h-full flex-col gap-5 rounded-2xl border bg-card p-7">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        item.bg
                      )}
                    >
                      <item.icon className={cn("h-6 w-6", item.color)} />
                    </div>
                    <span className="text-3xl font-bold text-muted-foreground/20">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency room image section */}
      <section className="border-t bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            <RevealSection className="flex-1">
              <div className="overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/images/emergency-room.jpg"
                  alt="Clean modern hospital emergency reception with welcoming staff"
                  width={600}
                  height={400}
                  className="h-auto w-full object-cover"
                />
              </div>
            </RevealSection>
            <RevealSection className="flex flex-1 flex-col gap-6" delay={150}>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-600">
                <Heart className="h-3 w-3" />
                Built for real situations
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Designed for the moments that matter most
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                When you or someone you care about needs medical attention, the
                last thing you want is to waste time calling around. Hospital
                Finder gives you the critical data upfront: which hospitals are
                close, which ones take your insurance, and what it might cost.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Trauma centers", icon: Zap },
                  { label: "Stroke centers", icon: Activity },
                  { label: "Burn units", icon: Heart },
                  { label: "Pediatric ER", icon: Users },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-3"
                  >
                    <item.icon className="h-4 w-4 text-teal-500" />
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl border bg-card p-10 text-center sm:p-16">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(13,148,136,0.06),transparent)]" />
              <div className="relative mx-auto flex max-w-lg flex-col items-center gap-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                  <Stethoscope className="h-8 w-8 text-teal-600" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Ready to find the right hospital?
                </h2>
                <p className="text-base text-muted-foreground">
                  It takes about 2 minutes. Your data stays on your device and is
                  never shared.
                </p>
                <Button
                  size="lg"
                  className="group h-14 rounded-2xl bg-teal-600 px-10 text-[15px] font-semibold text-white shadow-xl shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-2xl hover:shadow-teal-600/30 active:scale-[0.98]"
                  onClick={onStart}
                >
                  Get started now
                  <ArrowRight className="ml-2 h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">Hospital Finder</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            {[
              { icon: Clock, label: "Real-time ETA" },
              { icon: Shield, label: "Insurance verified" },
              { icon: DollarSign, label: "Cost estimates" },
              { icon: MapPin, label: "NYC coverage" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <item.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="max-w-lg text-center text-[11px] leading-relaxed text-muted-foreground">
            Not medical advice. For emergencies call 911. Insurance acceptance and
            costs are estimates only. Always confirm directly with the hospital and
            your insurer before seeking care.
          </p>
        </div>
      </footer>
    </div>
  );
}
