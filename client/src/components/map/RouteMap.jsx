import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SimulationTag } from '../common/Badge';
import { formatCoordinates } from '../../utils/formatters';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const createShipIcon = (heading = 0) => {
  const html = `
    <div style="transform: rotate(${heading}deg); transform-origin: center center;" class="relative flex items-center justify-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));">
        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-ship-route-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const RouteMap = ({
  origin,
  destination,
  waypoints = [],
  currentPosition,
  vesselName = 'Vessel',
  height = '450px',
  deviationNm = 0,
}) => {
  if (!origin || !destination) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400 rounded-xl">
        No valid origin and destination coordinates available for route mapping.
      </div>
    );
  }

  const fullRoutePoints = [
    [origin.lat, origin.lng],
    ...waypoints.map((w) => [w.lat, w.lng]),
    [destination.lat, destination.lng],
  ];

  const centerLat = (origin.lat + destination.lat) / 2;
  const centerLng = (origin.lng + destination.lng) / 2;

  const hasCurrentPos = currentPosition && currentPosition.lat != null && currentPosition.lng != null;
  const shipIcon = hasCurrentPos ? createShipIcon(currentPosition.heading || 0) : null;

  return (
    <div className="relative glass-panel rounded-xl overflow-hidden border border-sky-100 bg-white shadow-sm flex flex-col">
      {/* Route Header */}
      <div className="p-3.5 border-b border-sky-100 flex items-center justify-between bg-white z-[400] relative">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <h4 className="font-bold text-slate-900 text-xs tracking-wide">
            Transit Navigation &amp; Route Polyline
          </h4>
          {deviationNm > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              Cross-Track Deviation: {deviationNm.toFixed(1)} NM
            </span>
          )}
        </div>
        <SimulationTag label="OpenStreetMap Live Tiles" />
      </div>

      {/* Map Canvas */}
      <div style={{ height, minHeight: '420px' }} className="w-full relative z-[1]">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={4}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '420px' }}
        >
          <MapResizer />

          {/* Standard OpenStreetMap Free Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Planned Route Line */}
          <Polyline
            positions={fullRoutePoints}
            color="#0284c7"
            weight={3.5}
            opacity={0.85}
            dashArray="6, 8"
          />

          {/* Origin Marker */}
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={7}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="text-xs font-semibold text-white">
                Origin: {origin.name}
                <div className="text-[10px] text-slate-300 font-normal">
                  {formatCoordinates(origin.lat, origin.lng)}
                </div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Waypoints */}
          {waypoints.map((w, idx) => (
            <CircleMarker
              key={idx}
              center={[w.lat, w.lng]}
              radius={5}
              pathOptions={{ color: '#38bdf8', fillColor: '#0284c7', fillOpacity: 0.8 }}
            >
              <Popup>
                <div className="text-xs font-semibold text-white">
                  Waypoint {idx + 1}: {w.name || 'En-route point'}
                  <div className="text-[10px] text-slate-300 font-normal">
                    {formatCoordinates(w.lat, w.lng)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Destination Marker */}
          <CircleMarker
            center={[destination.lat, destination.lng]}
            radius={7}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="text-xs font-semibold text-white">
                Destination: {destination.name}
                <div className="text-[10px] text-slate-300 font-normal">
                  {formatCoordinates(destination.lat, destination.lng)}
                </div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Current Ship Position Marker */}
          {hasCurrentPos && (
            <Marker position={[currentPosition.lat, currentPosition.lng]} icon={shipIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-white text-sm">{vesselName}</div>
                  <div className="text-slate-300 mt-1">
                    Speed: {currentPosition.speedKnots || 0} knots
                  </div>
                  <div className="text-slate-300">
                    Heading: {currentPosition.heading || 0}°
                  </div>
                  <div className="text-[10px] text-purple-400 mt-1">
                    Demo Simulated Position
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="px-4 py-2 border-t border-sky-100 flex items-center justify-between text-xs text-slate-600 bg-sky-50/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Origin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Waypoint
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Destination
          </span>
          <span className="flex items-center gap-1.5 text-ocean-400 font-medium">
            &mdash; - Planned Corridor
          </span>
        </div>
        <span className="text-[11px] text-slate-400">OpenStreetMap (Zero API Key Required)</span>
      </div>
    </div>
  );
};
