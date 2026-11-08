import React, { useEffect, useRef, useState } from 'react';
import { WorkLog } from '../types';
import { MapPin, Compass, FileText } from 'lucide-react';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';

interface LiveMapProps {
  logs: WorkLog[];
  selectedWorker: string;
  onOpenReceipt: (log: WorkLog) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ logs, selectedWorker, onOpenReceipt }) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeSite, setActiveSite] = useState<WorkLog | null>(null);

  const validLocations = logs.filter(
    (l) => l.latitude !== null && l.longitude !== null && !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude))
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = validLocations.length > 0 ? (validLocations[0].latitude as number) : 22.5937;
      const initialLng = validLocations.length > 0 ? (validLocations[0].longitude as number) : 78.9629;
      const initialZoom = validLocations.length > 0 ? 5 : 4;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Shramik Sakshi',
        maxZoom: 18,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (map && markersLayer) {
      markersLayer.clearLayers();

      const customIcon = L.divIcon({
        className: 'custom-vintage-pin',
        html: `
          <div style="
            background: #1e7587;
            color: #ffffff;
            border: 2.5px solid #232b28;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 2px 0px #232b28;
          ">
            <span style="transform: rotate(45deg); font-size: 13px;">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const bounds = L.latLngBounds([]);

      validLocations.forEach((log) => {
        const lat = Number(log.latitude);
        const lng = Number(log.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          const marker = L.marker([lat, lng], { icon: customIcon });

          const popupContent = `
            <div style="font-family: 'Inter', sans-serif; min-width: 200px; padding: 4px; background: #fffef9; color: #232b28; border-radius: 8px;">
              <div style="border-bottom: 2px solid #232b28; padding-bottom: 4px; margin-bottom: 6px;">
                <span style="font-size: 10px; color: #e8638b; font-weight: 900; text-transform: uppercase;">
                  WORK LOCATION PIN
                </span>
                <h4 style="font-weight: 900; margin: 2px 0 0 0; color: #232b28; font-size: 14px;">
                  ${log.location_name || 'Work Site'}
                </h4>
              </div>
              <p style="margin: 3px 0; font-size: 12px; color: #232b28;">
                <strong>Worker:</strong> ${log.phone_number}
              </p>
              <p style="margin: 3px 0; font-size: 12px; color: #2f855a; font-weight: 800;">
                Daily Wage: ₹${log.estimated_wage.toFixed(2)}
              </p>
              <span style="font-family: monospace; font-size: 11px; color: #1e7587; font-weight: bold;">
                ${log.verification_token}
              </span>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', () => {
            setActiveSite(log);
          });

          markersLayer.addLayer(marker);
        }
      });

      if (validLocations.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [logs, selectedWorker]);

  return (
    <div className="comic-card rounded-2xl p-4 sm:p-6 mb-6 shadow-md overflow-hidden bg-[#fffdfa]">
      {/* Scalloped Green Roof */}
      <div className="roof-scallops-green -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b-2 border-[#232b28]/15 pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="bg-[#1e7587] text-white border-2 border-[#232b28] text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#232b28]">
              {t.surveyPlotBadge}
            </span>
            <span className="text-xs font-mono font-black text-[#2f855a]">
              {validLocations.length} {t.plottedStationsCount}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#232b28] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#1e7587] shrink-0" />
            <span>{t.mapChartTitle}</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#55694a] mt-0.5 font-semibold">
            {t.mapChartSubtitle}
          </p>
        </div>
      </div>

      <div className="comic-inset rounded-2xl overflow-hidden bg-white">
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 z-0"
          style={{ minHeight: '320px' }}
        />

        {/* Map footer bar */}
        <div className="bg-[#faf5e8] border-t-2 border-[#232b28] p-3.5 px-4 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 text-[#232b28]">
          <div className="flex flex-wrap items-center gap-3 font-extrabold text-[#55694a]">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] border border-[#232b28] animate-ping shrink-0"></span>
              <span>{t.activePinLabel}</span>
            </span>
            <span className="hidden sm:inline text-[#232b28]/30">•</span>
            <span className="text-[#1e7587]">
              {t.surveyScaleLabel}
            </span>
            <span className="hidden sm:inline text-[#232b28]/30">•</span>
            <span className="text-[#2f855a]">
              ✓ {t.gpsProtocolActive}
            </span>
          </div>

          {activeSite && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="font-mono font-black text-[#1e7587] text-xs sm:text-sm">
                {t.selectedLabel}: {activeSite.phone_number}
              </span>
              <button
                onClick={() => onOpenReceipt(activeSite)}
                className="comic-btn-pink px-3 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.viewVoucherBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
