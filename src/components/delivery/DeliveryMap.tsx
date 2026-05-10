'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapPin, ShoppingBag, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet + Next.js
const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const dropIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673188.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface DeliveryMapProps {
  pickup: [number, number];
  drop: [number, number];
  driver?: [number, number];
}

function MapUpdater({ pickup, drop }: { pickup: [number, number], drop: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([pickup, drop]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pickup, drop]);
  return null;
}

export default function DeliveryMap({ pickup, drop, driver }: DeliveryMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="h-64 bg-gray-900 animate-pulse rounded-3xl" />;

  return (
    <div className="h-64 md:h-96 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative">
      <MapContainer 
        center={pickup} 
        zoom={13} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <Marker position={pickup} icon={pickupIcon}>
          <Popup>Pickup: Vendor Location</Popup>
        </Marker>
        
        <Marker position={drop} icon={dropIcon}>
          <Popup>Drop-off: Customer Location</Popup>
        </Marker>

        {driver && (
          <Marker position={driver} icon={driverIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        <Polyline 
          positions={[pickup, drop]} 
          color="#3b82f6" 
          weight={4} 
          dashArray="10, 10"
          opacity={0.6}
        />
        
        <MapUpdater pickup={pickup} drop={drop} />
      </MapContainer>

      {/* Floating UI Elements */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-gray-900/90 backdrop-blur-md p-2 rounded-xl border border-gray-800 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">Live Navigation</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10">
        <button 
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pickup[0]},${pickup[1]}&destination=${drop[0]},${drop[1]}&travelmode=driving`, '_blank')}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <Navigation size={20} />
          <span className="text-sm font-black uppercase tracking-tight pr-2">Start Navigation</span>
        </button>
      </div>
    </div>
  );
}
