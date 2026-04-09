// src/components/customer/CitySelector.tsx
"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapPin, Check, ChevronDown, Loader2 } from "lucide-react";

interface CitySelectorProps {
  onCityChange: (city: string | undefined) => void;
  currentCity: string | undefined;
}

export default function CitySelector({ onCityChange, currentCity }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: cities, isLoading } = trpc.product.getCities.useQuery();

  const handleSelect = (city: string | undefined) => {
    onCityChange(city);
    setIsOpen(false);
    if (city) {
        localStorage.setItem("deeshora_city", city);
    } else {
        localStorage.removeItem("deeshora_city");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-all text-white"
      >
        <MapPin size={16} className="text-orange-400" />
        <span>{currentCity || "Select Local Area"}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b bg-gray-50/50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Locations</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <button
              onClick={() => handleSelect(undefined)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-orange-50 transition-colors text-gray-700"
            >
              <span>All Areas</span>
              {!currentCity && <Check size={14} className="text-orange-500" />}
            </button>
            
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 size={20} className="animate-spin text-orange-500 mx-auto" />
              </div>
            ) : (
              cities?.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-orange-50 transition-colors text-gray-700 font-medium capitalize"
                >
                  <span>{city}</span>
                  {currentCity === city && <Check size={14} className="text-orange-500" />}
                </button>
              ))
            )}
          </div>
          {cities?.length === 0 && !isLoading && (
            <div className="p-4 text-center text-xs text-gray-400">
              No active local vendors found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
