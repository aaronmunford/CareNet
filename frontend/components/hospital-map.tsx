"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Hospital } from "@/lib/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapLegend } from "@/components/map-legend";
import { Maximize2, Minimize2, Crosshair } from "lucide-react";

interface HospitalMapProps {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (hospital: Hospital) => void;
  userLocation?: { lat: number; lng: number; label: string } | null;
}

const MANHATTAN_CENTER: [number, number] = [40.7731, -73.9537];
const DEFAULT_ZOOM = 13;

// Distance circle radii in miles
const DISTANCE_CIRCLES = [0.5, 1, 2, 3];

function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

function getDirectionsUrl(
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
}

type ProviderType = "hospital_er" | "urgent_care" | "primary_care" | "specialist" | "dentist" | "physical_therapist";
type NetworkStatus = "in_network" | "out_of_network" | "unknown";

function getProviderIconSVG(type: ProviderType): string {
  switch (type) {
    case "hospital_er":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg>`;
    case "urgent_care":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
    case "dentist":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c-3.5 0-6 2.5-6 6 0 2 0.5 3.5 1 5 0.3 0.8 0.5 1.5 0.5 2.5v2c0 1.1 0.9 2 2 2s2-0.9 2-2v-3c0-0.6 0.4-1 1-1h1c0.6 0 1 0.4 1 1v3c0 1.1 0.9 2 2 2s2-0.9 2-2v-2c0-1 0.2-1.7 0.5-2.5 0.5-1.5 1-3 1-5 0-3.5-2.5-6-6-6z"/></svg>`;
    case "physical_therapist":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`;
    case "primary_care":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/></svg>`;
    case "specialist":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
}

function getNetworkStatusColor(networkStatus: NetworkStatus): string {
  switch (networkStatus) {
    case "in_network":
      return "#10b981"; // green
    case "out_of_network":
      return "#ef4444"; // red
    case "unknown":
      return "#6b7280"; // gray
  }
}

function createProviderIcon(
  type: ProviderType,
  networkStatus: NetworkStatus,
  isSelected: boolean
): L.DivIcon {
  const size = isSelected ? 40 : 32;
  const bg = getNetworkStatusColor(networkStatus);
  const shadow = isSelected
    ? "0 4px 20px rgba(0,0,0,0.3)"
    : "0 2px 8px rgba(0,0,0,0.15)";
  const iconSVG = getProviderIconSVG(type);

  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${bg};
      border:2.5px solid #ffffff;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      color:#ffffff;
      transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
      cursor:pointer;
      ${isSelected ? "transform:scale(1.15);" : ""}
    ">${iconSVG}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createUserLocationIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:-6px;
        border-radius:50%;
        background:rgba(13,148,136,0.15);
        animation:location-pulse 2s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:3px;left:3px;
        width:18px;height:18px;
        border-radius:50%;
        background:#0d9488;
        border:3px solid #fff;
        box-shadow:0 2px 12px rgba(13,148,136,0.5);
      "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function HospitalMap({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  userLocation,
}: HospitalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const distanceCirclesRef = useRef<L.Circle[]>([]);
  const distanceLabelsRef = useRef<L.Marker[]>([]);
  const onSelectRef = useRef(onSelectHospital);
  onSelectRef.current = onSelectHospital;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistanceCircles, setShowDistanceCircles] = useState(true);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = mapContainerRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Recenter on user location
  const recenterOnUser = useCallback(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
      duration: 0.8,
    });
  }, [userLocation]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
    }).setView(MANHATTAN_CENTER, DEFAULT_ZOOM);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    // CartoDB Voyager - free, detailed, shows NYC neighborhoods
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    for (const m of markersRef.current.values()) m.remove();
    markersRef.current.clear();

    for (let i = 0; i < hospitals.length; i++) {
      const hospital = hospitals[i];
      const isSelected = hospital.id === selectedHospitalId;
      const providerType = hospital.type || "hospital_er";
      const networkStatus = hospital.networkStatus || "unknown";
      const icon = createProviderIcon(providerType, networkStatus, isSelected);

      // Build network badge
      let networkBadge = "";
      if (networkStatus === "in_network") {
        networkBadge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#d1fae5;color:#065f46;font-size:10px;font-weight:600;margin-top:4px;">In-Network</span>`;
      } else if (networkStatus === "out_of_network") {
        networkBadge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#fee2e2;color:#991b1b;font-size:10px;font-weight:600;margin-top:4px;">Out-of-Network</span>`;
      }

      // Build cost estimate
      let costEstimate = "";
      if (hospital.estimatedCopay && hospital.estimatedCopay.min !== null) {
        const copayText = hospital.estimatedCopay.min === hospital.estimatedCopay.max
          ? `$${hospital.estimatedCopay.min}`
          : `$${hospital.estimatedCopay.min}-$${hospital.estimatedCopay.max}`;
        costEstimate = `<div style="font-size:11px;color:#475569;margin-top:4px;font-weight:500;">Est. ${copayText} copay</div>`;
      }

      // Build directions button if user location exists
      let directionsBtn = "";
      if (userLocation) {
        const directionsUrl = getDirectionsUrl(
          userLocation.lat,
          userLocation.lng,
          hospital.lat,
          hospital.lng
        );
        directionsBtn = `
          <a href="${directionsUrl}"
             target="_blank" rel="noopener noreferrer"
             style="display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;
                    background:linear-gradient(135deg,#2563eb,#0f766e);color:#fff;border-radius:8px;font-size:11px;font-weight:600;
                    text-decoration:none;transition:all 0.2s;box-shadow:0 2px 8px rgba(37,99,235,0.3);margin-top:8px;width:100%;"
             onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polygon points="3 11 22 2 13 21 11 13 3 11"/>
             </svg>
             Get Directions
          </a>`;
      }

      const marker = L.marker([hospital.lat, hospital.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;min-width:200px;padding:6px 2px;">
            <strong style="font-size:13px;font-weight:600;line-height:1.4;display:block;color:#0f172a;">${hospital.name}</strong>
            ${networkBadge}
            ${costEstimate}
            <div style="font-size:11px;color:#64748b;margin-top:6px;display:flex;gap:12px;">
              <span style="display:flex;align-items:center;gap:3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ~${hospital.etaMinutes} min
              </span>
              <span>${hospital.distanceMiles} mi</span>
            </div>
            ${directionsBtn}
          </div>`,
          { closeButton: false, className: "clean-popup", maxWidth: 260 }
        );

      marker.on("click", () => onSelectRef.current(hospital));
      markersRef.current.set(hospital.id, marker);
    }
  }, [hospitals, selectedHospitalId]);

  // Update distance circles when user location or toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing circles and labels
    for (const circle of distanceCirclesRef.current) {
      circle.remove();
    }
    distanceCirclesRef.current = [];

    for (const label of distanceLabelsRef.current) {
      label.remove();
    }
    distanceLabelsRef.current = [];

    if (userLocation && showDistanceCircles) {
      for (const miles of DISTANCE_CIRCLES) {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: milesToMeters(miles),
          color: "#3b82f6",
          weight: 1,
          opacity: 0.4,
          fill: false,
          dashArray: "5, 5",
        }).addTo(map);

        // Add distance label at top of circle
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="
            background:rgba(59,130,246,0.9);
            color:#fff;
            padding:2px 6px;
            border-radius:4px;
            font-size:10px;
            font-weight:600;
            font-family:Inter,system-ui,sans-serif;
            white-space:nowrap;
          ">${miles} mi</div>`,
          iconSize: [40, 16],
          iconAnchor: [20, 8],
        });

        // Place label at top of circle
        const labelLat = userLocation.lat + milesToMeters(miles) / 111320;
        const labelMarker = L.marker([labelLat, userLocation.lng], {
          icon: labelIcon,
          interactive: false,
        });
        labelMarker.addTo(map);

        distanceCirclesRef.current.push(circle);
        distanceLabelsRef.current.push(labelMarker);
      }
    }
  }, [userLocation, showDistanceCircles]);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = createUserLocationIcon();
      userMarkerRef.current = L.marker(
        [userLocation.lat, userLocation.lng],
        { icon, zIndexOffset: 1000 }
      )
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;padding:4px 0;">
            <strong style="font-size:12px;font-weight:600;">You</strong>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${userLocation.label}</div>
          </div>`,
          { closeButton: false, className: "clean-popup" }
        );
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHospitalId) return;
    const hospital = hospitals.find((h) => h.id === selectedHospitalId);
    if (hospital) {
      mapInstanceRef.current.flyTo([hospital.lat, hospital.lng], 15, {
        duration: 0.6,
      });
      markersRef.current.get(hospital.id)?.openPopup();
    }
  }, [selectedHospitalId, hospitals]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border shadow-sm">
      <div ref={mapContainerRef} className="h-full w-full" />
      <MapLegend />

      {/* Map controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        {userLocation && (
          <button
            onClick={recenterOnUser}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
            title="Recenter on your location"
          >
            <Crosshair className="h-5 w-5 text-gray-700" />
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-700" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-700" />
          )}
        </button>

        {userLocation && (
          <button
            onClick={() => setShowDistanceCircles(!showDistanceCircles)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md transition-all hover:shadow-lg ${
              showDistanceCircles ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={showDistanceCircles ? "Hide distance circles" : "Show distance circles"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
