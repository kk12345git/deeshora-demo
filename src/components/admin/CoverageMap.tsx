// src/components/admin/CoverageMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface CoverageMapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  areas?: any[];
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
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
  center = [13.1610, 80.3015], // Thiruvottriyur center
  zoom = 13, 
  onLocationSelect,
  areas = []
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
                  <span className={`text-[10px] uppercase font-bold ${area.isServiceable ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {area.isServiceable ? 'Live' : 'Coming Soon'}
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
