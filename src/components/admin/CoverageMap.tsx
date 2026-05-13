// src/components/admin/CoverageMap.tsx
"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface CoverageMapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  areas?: Array<{
    id: string;
    label: string;
    zone: string;
    isServiceable: boolean;
    coordinates: any;
  }>;
}

function LocationMarker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

export default function CoverageMap({
  center = [13.161, 80.3015], // Thiruvottriyur center
  zoom = 13,
  onLocationSelect,
  areas = [],
}: CoverageMapProps) {
  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {areas.map((area) => {
          if (!area.coordinates) return null;
          const coords = area.coordinates as { lat: number; lng: number };
          return (
            <Marker key={area.id} position={[coords.lat, coords.lng]}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-sm">{area.label}</p>
                  <p className="text-xs text-gray-500">{area.zone}</p>
                  <span
                    className={`text-[10px] uppercase font-bold ${
                      area.isServiceable ? "text-emerald-600" : "text-brand-600"
                    }`}
                  >
                    {area.isServiceable ? "Live" : "Coming Soon"}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {onLocationSelect && <LocationMarker onSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  );
}
