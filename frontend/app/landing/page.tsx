"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const teamMembers = [
    {
        name: "Aaron Munford",
        university: "NYU",
        role: "Full Stack Developer",
        image: "/team/aaron.jpg",
    },
    {
        name: "Zurabi Kochiashvili",
        university: "Stony Brook",
        role: "Backend Engineer",
        image: "/team/zurabi.jpg",
    },
    {
        name: "Raymond Lee",
        university: "Stony Brook",
        role: "AI/ML Engineer",
        image: "/team/raymond.jpg",
    },
    {
        name: "Joe Yang",
        university: "Columbia",
        role: "Product Designer",
        image: "/team/joe.jpg",
    },
];

const features = [
    {
        icon: "🗺️",
        title: "Real-Time Hospital Finder",
        description: "See every ER, urgent care, and clinic near you on an interactive map",
    },
    {
        icon: "💰",
        title: "Instant Cost Estimates",
        description: "Know what you'll pay before you walk in the door",
    },
    {
        icon: "📷",
        title: "AI Card Scanner",
        description: "Snap a photo of your insurance card - our AI does the rest",
    },
    {
        icon: "📞",
        title: "Voice AI Booking",
        description: "Our AI agent calls hospitals and books appointments for you",
    },
];

export default function LandingPage() {
    const [videoError, setVideoError] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/carenet-logo.svg" alt="CareNet" width={32} height={32} />
                        <span className="text-xl font-bold text-gray-900">CareNet</span>
                    </div>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                    >
                        Try CareNet
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                        Find care you can
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> afford</span>,
                        <br />fast.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
                        Stop gambling on ER bills. CareNet shows you nearby hospitals, your insurance coverage, and estimated costs—all in seconds.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105"
                        >
                            Get Started Free
                        </Link>
                        <a
                            href="#demo"
                            className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all"
                        >
                            Watch Demo
                        </a>
                    </div>
                </div>
            </section>

            {/* Video Demo Section */}
            <section id="demo" className="py-20 px-6 bg-gray-900">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                        See CareNet in Action
                    </h2>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        {!videoError ? (
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full"
                                onError={() => setVideoError(true)}
                            >
                                <source src="/CareNet_walkthrough.mp4" type="video/mp4" />
                            </video>
                        ) : (
                            <iframe
                                width="100%"
                                height="500"
                                src="https://www.youtube.com/embed/ULFyyhtHCl8?autoplay=1&loop=1&mute=1&playlist=ULFyyhtHCl8"
                                title="CareNet Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="aspect-video"
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* Problem Statement */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                        Healthcare in America is Broken
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="p-6">
                            <div className="text-4xl font-bold text-red-600 mb-2">32M</div>
                            <div className="text-gray-600">Americans uninsured</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl font-bold text-red-600 mb-2">66%</div>
                            <div className="text-gray-600">Bankruptcies from medical bills</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl font-bold text-red-600 mb-2">$20K+</div>
                            <div className="text-gray-600">Out-of-network ER visit</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl font-bold text-red-600 mb-2">1 in 4</div>
                            <div className="text-gray-600">Skip care due to cost</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
                        How CareNet Helps
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Screenshots */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
                        Beautiful, Intuitive Design
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/screenshot-main.png"
                                alt="CareNet Map View"
                                width={800}
                                height={600}
                                className="w-full"
                            />
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/screenshot-triage.png"
                                alt="CareNet AI Triage"
                                width={800}
                                height={600}
                                className="w-full"
                            />
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/screenshot-booking.png"
                                alt="CareNet Booking Agent"
                                width={800}
                                height={600}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 px-6 bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Meet the Team
                    </h2>
                    <p className="text-gray-400 text-center mb-16">
                        Built with ❤️ at DevFest 2026
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 rounded-2xl p-6 text-center hover:bg-gray-750 transition-colors"
                            >
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                                    {member.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    {member.name}
                                </h3>
                                <p className="text-blue-400 mb-1">{member.role}</p>
                                <p className="text-gray-500 text-sm">{member.university}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Find Affordable Care?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Stop worrying about surprise bills. Start using CareNet today.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-10 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all hover:scale-105"
                    >
                        Try CareNet Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-gray-900 border-t border-gray-800">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Image src="/carenet-logo.svg" alt="CareNet" width={24} height={24} />
                        <span className="text-lg font-bold text-white">CareNet</span>
                    </div>
                    <p className="text-gray-500">
                        Because healthcare shouldn't be a guessing game.
                    </p>
                    <p className="text-gray-600 mt-4 text-sm">
                        © 2026 CareNet. Built at DevFest 2026.
                    </p>
                </div>
            </footer>
        </div>
    );
}
