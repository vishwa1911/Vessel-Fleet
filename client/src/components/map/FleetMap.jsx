import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Badge, SimulationTag } from '../common/Badge';
import { formatCoordinates } from '../../utils/formatters';

// Map Auto-resizer component to ensure Leaflet renders immediately without grey tile glitch
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

// Factory to create custom SVG ship marker icons with heading rotation and status colors
const createVesselIcon = (status, heading = 0) => {
  const colors = {
    Active: '#10b981', // Emerald
    'In Port': '#0284c7', // Sky
    'Under Maintenance': '#f59e0b', // Amber
    Idle: '#64748b', // Slate
  };
  const color = colors[status] || '#0284c7';

  const html = `
    <div style="transform: rotate(${heading}deg); transform-origin: center center;" class="relative flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vessel-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const FleetMap = ({ vessels = [], height = '500px' }) => {
  // Default center: Indian Ocean / Malacca / Bay of Bengal hub
  const defaultCenter = [12.0, 80.0];
  const defaultZoom = 3;

  return (
    <div className="relative glass-panel rounded-xl overflow-hidden border border-slate-800 flex flex-col">
      {/* Map Header Overlay */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-maritime-900/90 z-[400] relative">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-semibold text-white text-sm tracking-wide">
            Global Fleet Operations Map
          </h3>
          <span className="text-xs text-slate-400">({vessels.length} tracked vessels)</span>
        </div>
        <SimulationTag label="OpenStreetMap Live Tiles" />
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height, minHeight: '480px' }} className="w-full relative z-[1]">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '480px' }}
        >
          <MapResizer />

          {/* Standard OpenStreetMap Free Tiles (Zero API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {vessels.map((v) => {
            const pos = v.lastKnownPosition;
            if (!pos || pos.lat == null || pos.lng == null) return null;

            const icon = createVesselIcon(v.status, pos.heading || 0);

            return (
              <Marker key={v._id} position={[pos.lat, pos.lng]} icon={icon}>
                <Popup>
                  <div className="p-1 min-w-[200px] text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                      <h4 className="font-bold text-white text-sm">{v.name}</h4>
                      <Badge status={v.status} size="xs" />
                    </div>

                    <div className="space-y-1 text-slate-300">
                      <div><span className="text-slate-400">Type:</span> {v.type}</div>
                      <div><span className="text-slate-400">IMO:</span> {v.imoNumber} ({v.flag})</div>
                      <div><span className="text-slate-400">Speed:</span> {pos.speedKnots || 0} knots</div>
                      <div><span className="text-slate-400">Heading:</span> {pos.heading || 0}°</div>
                      <div><span className="text-slate-400">Pos:</span> {formatCoordinates(pos.lat, pos.lng)}</div>
                      <div className="pt-1">
                        <span className="text-[10px] text-purple-400 font-medium">Source: {pos.source || 'demo-simulated'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/60">
                      <Link
                        to={`/vessels/${v._id}`}
                        className="block text-center py-1.5 px-3 bg-ocean-600 hover:bg-ocean-500 text-white font-medium rounded text-xs transition"
                      >
                        View Full Telemetry & Specs &rarr;
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-maritime-900/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> In Port
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Idle
          </span>
        </div>
        <span className="text-[11px] text-slate-400">OpenStreetMap (Free &amp; Open Source - No API Key)</span>
      </div>
    </div>
  );
};
