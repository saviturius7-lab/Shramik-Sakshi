import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WorkLog } from '../types';
import {
  Compass,
  FileText,
  Crosshair,
  ShieldCheck,
  Navigation,
  Maximize2,
  Minimize2,
  LocateFixed,
  Scale,
  Search,
  Layers,
  MapPin,
} from 'lucide-react';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import {
  acquireHighAccuracyPosition,
  HighAccuracyPosition,
  KNOWN_HUBS,
} from '../utils/geolocation';
import { CourtEvidenceCertificateModal } from './CourtEvidenceCertificateModal';

interface LiveMapProps {
  logs: WorkLog[];
  selectedWorker: string;
  onOpenReceipt: (log: WorkLog) => void;
}

type MapLayerStyle = 'voyager' | 'street' | 'satellite';
type PinStatusFilter = 'all' | 'verified' | 'pending' | 'disputed';

interface PositionedLog {
  log: WorkLog;
  rawLat: number;
  rawLng: number;
  displayLat: number;
  displayLng: number;
  wasSpread: boolean;
}

function getLogCategory(log: WorkLog): 'verified' | 'pending' | 'disputed' {
  if (log.verification_status === 'attendance_disputed' || log.status === 'disputed') {
    return 'disputed';
  }
  if (log.verification_status === 'attendance_acknowledged' || log.status === 'verified') {
    return 'verified';
  }
  return 'pending';
}

/**
 * Deterministic tiny spiral spread for overlapping pins at the same worksite
 * so multiple workers remain individually visible & clickable without hiding each other.
 */
function spreadOverlappingLogs(logs: WorkLog[]): PositionedLog[] {
  const buckets = new Map<string, WorkLog[]>();

  logs.forEach((log) => {
    const lat = Number(log.latitude);
    const lng = Number(log.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    // Bucket within ~11 meters (~0.0001 deg)
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const group = buckets.get(key);
    if (group) {
      group.push(log);
    } else {
      buckets.set(key, [log]);
    }
  });

  const positioned: PositionedLog[] = [];
  buckets.forEach((group) => {
    group.forEach((log, index) => {
      const rawLat = Number(log.latitude);
      const rawLng = Number(log.longitude);
      if (group.length === 1 || index === 0) {
        positioned.push({
          log,
          rawLat,
          rawLng,
          displayLat: rawLat,
          displayLng: rawLng,
          wasSpread: false,
        });
      } else {
        const angle = (index * 2 * Math.PI) / Math.max(group.length - 1, 1);
        const metersOffset = 18 + Math.floor((index - 1) / 6) * 12;
        const dLat = (metersOffset / 111320) * Math.cos(angle);
        const dLng =
          (metersOffset / (111320 * Math.max(0.2, Math.cos((rawLat * Math.PI) / 180)))) *
          Math.sin(angle);
        positioned.push({
          log,
          rawLat,
          rawLng,
          displayLat: rawLat + dLat,
          displayLng: rawLng + dLng,
          wasSpread: true,
        });
      }
    });
  });

  return positioned;
}

export const LiveMap: React.FC<LiveMapProps> = ({ logs, selectedWorker, onOpenReceipt }) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByLogIdRef = useRef<Map<string, L.Marker>>(new Map());
  const tileLayersRef = useRef<{
    voyager: L.TileLayer;
    street: L.TileLayer;
    satellite: L.TileLayer;
  } | null>(null);

  const [activeSite, setActiveSite] = useState<WorkLog | null>(null);
  const [courtExhibitLog, setCourtExhibitLog] = useState<WorkLog | null>(null);
  const [mapType, setMapType] = useState<MapLayerStyle>('voyager');
  const [statusFilter, setStatusFilter] = useState<PinStatusFilter>('all');
  const [pinSearch, setPinSearch] = useState('');
  const [showGeofences, setShowGeofences] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locateStatus, setLocateStatus] = useState<string | null>(null);
  const [hoveredLogId, setHoveredLogId] = useState<string | null>(null);

  const validLocations = useMemo(() => {
    return logs.filter(
      (l) =>
        l.latitude !== null &&
        l.longitude !== null &&
        !isNaN(Number(l.latitude)) &&
        !isNaN(Number(l.longitude))
    );
  }, [logs]);

  const filteredLocations = useMemo(() => {
    const query = pinSearch.trim().toLowerCase();
    return validLocations.filter((l) => {
      if (statusFilter !== 'all' && getLogCategory(l) !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        (l.location_name || '').toLowerCase().includes(query) ||
        l.phone_number.toLowerCase().includes(query) ||
        (l.worker_name || '').toLowerCase().includes(query) ||
        (l.verification_token || '').toLowerCase().includes(query)
      );
    });
  }, [validLocations, statusFilter, pinSearch]);

  const positionedLogs = useMemo(() => spreadOverlappingLogs(filteredLocations), [filteredLocations]);

  // Initialize Leaflet map once with silky-smooth physics & ResizeObserver
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!mapInstanceRef.current) {
      const initialLat = validLocations.length > 0 ? Number(validLocations[0].latitude) : 22.5937;
      const initialLng = validLocations.length > 0 ? Number(validLocations[0].longitude) : 78.9629;
      const initialZoom = validLocations.length > 0 ? 12 : 5;

      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: false,
        maxZoom: 19,
        minZoom: 3,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 65,
        wheelDebounceTime: 25,
        inertia: true,
        inertiaDeceleration: 2400,
        inertiaMaxSpeed: 1800,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

      const voyagerLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO | Shramik Sakshi',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      );

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Shramik Sakshi',
        maxZoom: 19,
      });

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Imagery | Shramik Sakshi',
          maxZoom: 19,
        }
      );

      voyagerLayer.addTo(map);
      tileLayersRef.current = {
        voyager: voyagerLayer,
        street: streetLayer,
        satellite: satelliteLayer,
      };

      geofenceLayerRef.current = L.layerGroup().addTo(map);
      circlesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      userLocLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize({ animate: false });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render geofence hub boundaries smoothly
  useEffect(() => {
    const geofenceLayer = geofenceLayerRef.current;
    if (!geofenceLayer) return;
    geofenceLayer.clearLayers();

    if (!showGeofences) return;

    KNOWN_HUBS.forEach((hub) => {
      const boundary = L.circle([hub.lat, hub.lng], {
        radius: hub.radiusM,
        color: '#1e7587',
        fillColor: '#1e7587',
        fillOpacity: 0.04,
        weight: 1.25,
        dashArray: '6, 6',
        interactive: true,
      });
      boundary.bindTooltip(`Authorized Zone: ${hub.name.split('(')[0].trim()}`, {
        direction: 'top',
        sticky: true,
      });
      geofenceLayer.addLayer(boundary);
    });
  }, [showGeofences]);

  // Render pins, tether lines, and accuracy rings
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const circlesLayer = circlesLayerRef.current;

    if (!map || !markersLayer || !circlesLayer) return;

    markersLayer.clearLayers();
    circlesLayer.clearLayers();
    markerByLogIdRef.current.clear();

    const bounds = L.latLngBounds([]);

    positionedLogs.forEach(({ log, rawLat, rawLng, displayLat, displayLng, wasSpread }) => {
      bounds.extend([rawLat, rawLng]);
      const accuracyMeters = Number(log.gps_accuracy_meters) || 8.0;
      const isHardware = log.telemetry_source === 'hardware_gps';
      const category = getLogCategory(log);

      const pinBg =
        category === 'disputed'
          ? '#9b2226'
          : category === 'verified'
          ? '#1b4332'
          : '#b45309';

      const ringColor =
        category === 'disputed'
          ? '#ef4444'
          : isHardware
          ? '#10b981'
          : '#d97706';

      // Accuracy Confidence Circle centered at true raw coordinate
      const circle = L.circle([rawLat, rawLng], {
        radius: Math.max(accuracyMeters, 5),
        color: ringColor,
        fillColor: ringColor,
        fillOpacity: hoveredLogId === log.id ? 0.3 : 0.14,
        weight: hoveredLogId === log.id ? 2.5 : 1.5,
        dashArray: isHardware ? undefined : '4, 4',
      });
      circlesLayer.addLayer(circle);

      // Tether line if marker was offset for anti-collision readability
      if (wasSpread) {
        const tether = L.polyline(
          [
            [rawLat, rawLng],
            [displayLat, displayLng],
          ],
          {
            color: '#232b28',
            weight: 1.25,
            dashArray: '3, 3',
            opacity: 0.65,
          }
        );
        circlesLayer.addLayer(tether);
      }

      const isActive = activeSite?.id === log.id || hoveredLogId === log.id;
      const customIcon = L.divIcon({
        className: 'custom-vintage-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; transition: transform 0.2s ease; transform: scale(${isActive ? '1.18' : '1'});">
            <div style="
              background: ${pinBg};
              color: #ffffff;
              border: 2.5px solid #232b28;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 2px 2px 0px #232b28;
              margin: 3px;
            ">
              <span style="transform: rotate(45deg); font-size: 13px;">${category === 'disputed' ? '⚠️' : '📍'}</span>
            </div>
            <div style="
              position: absolute;
              bottom: -2px;
              right: -4px;
              background: ${isHardware ? '#059669' : '#b45309'};
              color: white;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 4px;
              border-radius: 5px;
              border: 1px solid #1c2421;
              white-space: nowrap;
              font-family: monospace;
            ">
              ±${Math.round(accuracyMeters)}m
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([displayLat, displayLng], {
        icon: customIcon,
        zIndexOffset: isActive ? 500 : 0,
      });

      const grade =
        log.evidence_grade || (accuracyMeters <= 5 ? 'JUDICIAL_GRADE' : 'EVIDENTIARY_GRADE');
      const score = log.evidence_confidence_score || (accuracyMeters <= 5 ? 98 : 88);

      const popupContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 235px; padding: 6px 4px; background: #fffef9; color: #232b28;">
          <div style="border-bottom: 1.5px solid #232b28; padding-bottom: 5px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
              <span style="font-size: 10px; color: ${isHardware ? '#059669' : '#b45309'}; font-weight: 900; text-transform: uppercase;">
                ${isHardware ? 'JUDICIAL GNSS FIX' : 'WORKSITE PIN'}
              </span>
              <span style="font-size: 10px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 1px 5px; border-radius: 4px; border: 1px solid #0284c7;">
                ±${accuracyMeters.toFixed(1)}m
              </span>
            </div>
            <h4 style="font-weight: 900; margin: 3px 0 0 0; color: #232b28; font-size: 13px; line-height: 1.3;">
              ${log.location_name || 'Work Site'}
            </h4>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 5px 6px; border-radius: 5px; margin-bottom: 6px; font-size: 10px;">
            <div style="font-weight: 900; color: #166534; display: flex; justify-content: space-between;">
              <span>SEC 63 BSA: ${grade.replace('_', ' ')}</span>
              <span>${score}/100</span>
            </div>
            <div style="color: #475569; font-size: 9px; margin-top: 2px;">
              WGS-84 Datum · Clock Δt ${log.clock_skew_ms ?? 0}ms
            </div>
          </div>

          <div style="background: #f8fafc; padding: 5px 6px; border-radius: 5px; border: 1px solid #cbd5e1; margin-bottom: 6px;">
            <div style="font-family: monospace; font-size: 11px; color: #0f172a; font-weight: 800;">
              Lat: ${rawLat.toFixed(6)}° N
            </div>
            <div style="font-family: monospace; font-size: 11px; color: #0f172a; font-weight: 800;">
              Lng: ${rawLng.toFixed(6)}° E
            </div>
          </div>

          <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
            <strong>Worker:</strong> <span style="font-family: monospace; font-weight: 700;">${log.worker_name ? `${log.worker_name} · ` : ''}${log.phone_number}</span>
          </div>
          <div style="font-size: 11px; color: #166534; font-weight: 800; margin-bottom: 4px;">
            Daily Wage: ₹${(Number(log.actual_wage_earned ?? log.estimated_wage) || 600).toFixed(2)}
          </div>
          <div style="font-family: monospace; font-size: 10px; color: #1e7587; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
            Docket: #${log.verification_token}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setActiveSite(log);
        map.flyTo([displayLat, displayLng], Math.max(map.getZoom(), 15.5), {
          animate: true,
          duration: 0.65,
          easeLinearity: 0.25,
        });
      });

      markersLayer.addLayer(marker);
      markerByLogIdRef.current.set(log.id, marker);
    });

    if (positionedLogs.length > 0 && bounds.isValid()) {
      map.flyToBounds(bounds, {
        padding: [48, 48],
        maxZoom: 15.5,
        duration: 0.75,
        easeLinearity: 0.25,
      });
    }
  }, [positionedLogs, selectedWorker, activeSite?.id, hoveredLogId]);

  const handleToggleMapType = (type: MapLayerStyle) => {
    const map = mapInstanceRef.current;
    const layers = tileLayersRef.current;
    if (!map || !layers) return;

    Object.values(layers).forEach((l) => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });
    map.addLayer(layers[type]);
    setMapType(type);
  };

  const handleFlyToPin = (item: PositionedLog) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setActiveSite(item.log);
    map.flyTo([item.displayLat, item.displayLng], 16.5, {
      animate: true,
      duration: 0.85,
      easeLinearity: 0.25,
    });
    const marker = markerByLogIdRef.current.get(item.log.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 420);
    }
  };

  const handleFitAllPins = () => {
    const map = mapInstanceRef.current;
    if (!map || positionedLogs.length === 0) return;
    const bounds = L.latLngBounds(positionedLogs.map((p) => [p.rawLat, p.rawLng]));
    if (bounds.isValid()) {
      map.flyToBounds(bounds, {
        padding: [48, 48],
        maxZoom: 15.5,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize({ animate: true });
    }, 120);
  };

  const handleLocateMe = async () => {
    if (!mapInstanceRef.current || !userLocLayerRef.current) return;
    setIsLocatingUser(true);
    setLocateStatus('Acquiring high-accuracy GNSS fix...');

    try {
      const pos: HighAccuracyPosition = await acquireHighAccuracyPosition((status) => {
        setLocateStatus(status);
      });

      setLocateStatus(`Locked! Accuracy: ±${pos.accuracy}m`);

      const map = mapInstanceRef.current;
      const userLayer = userLocLayerRef.current;
      userLayer.clearLayers();

      const userCircle = L.circle([pos.latitude, pos.longitude], {
        radius: Math.max(pos.accuracy, 4),
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.22,
        weight: 2,
      });

      const userIcon = L.divIcon({
        className: 'user-pulse-icon',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            background: #2563eb;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(37, 99, 235, 0.75);
            position: relative;
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const userMarker = L.marker([pos.latitude, pos.longitude], { icon: userIcon });
      userMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <strong style="color: #1e40af; font-size: 12px;">Your Live Position</strong>
          <div style="font-size: 11px; margin-top: 3px;">
            <strong>GPS Accuracy:</strong> ±${pos.accuracy}m
          </div>
          <div style="font-family: monospace; font-size: 10px; color: #475569; margin-top: 2px;">
            ${pos.latitude.toFixed(6)}°, ${pos.longitude.toFixed(6)}°
          </div>
          <div style="font-size: 11px; color: #1e293b; margin-top: 3px;">
            ${pos.locationName}
          </div>
        </div>
      `);

      userLayer.addLayer(userCircle);
      userLayer.addLayer(userMarker);

      map.flyTo([pos.latitude, pos.longitude], 17, {
        animate: true,
        duration: 1.0,
        easeLinearity: 0.25,
      });

      setTimeout(() => {
        userMarker.openPopup();
        setIsLocatingUser(false);
      }, 1050);
    } catch (err: any) {
      setLocateStatus(`GPS unavailable: ${err.message || 'Could not acquire fix'}`);
      setIsLocatingUser(false);
    }
  };

  return (
    <div
      className={`civic-card p-4 sm:p-6 mb-6 overflow-hidden bg-[#fffdfa] ${
        isExpanded ? 'fixed inset-3 z-50 flex flex-col mb-0 shadow-2xl' : ''
      }`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-b border-[#1c2421]/15 pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1e7587] mb-1">
            <span className="uppercase tracking-wider">{t.surveyPlotBadge}</span>
            <span className="text-[#1c2421]/30">·</span>
            <span className="text-[#1b4332] tabular-nums">
              {positionedLogs.length} / {validLocations.length} {t.plottedStationsCount}
            </span>
            <span className="text-[#1c2421]/30">·</span>
            <span className="inline-flex items-center gap-1 text-[#0369a1]">
              <ShieldCheck className="w-3.5 h-3.5" />
              WGS-84 6-Decimal Precision
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#19231f] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#1e7587] shrink-0" />
            <span>{t.mapChartTitle}</span>
          </h3>
        </div>

        {/* Map Type Switcher & Camera Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center bg-[#f4ede0] p-1 rounded border border-[#1c2421]/40">
            <button
              type="button"
              onClick={() => handleToggleMapType('voyager')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                mapType === 'voyager' ? 'bg-[#1b4332] text-white' : 'text-[#19231f] hover:bg-white/70'
              }`}
            >
              Clean GIS
            </button>
            <button
              type="button"
              onClick={() => handleToggleMapType('street')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                mapType === 'street' ? 'bg-[#1b4332] text-white' : 'text-[#19231f] hover:bg-white/70'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => handleToggleMapType('satellite')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                mapType === 'satellite' ? 'bg-[#1b4332] text-white' : 'text-[#19231f] hover:bg-white/70'
              }`}
            >
              Satellite HD
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGeofences((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-bold rounded border border-[#1c2421] flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              showGeofences ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-white text-[#3d4a44]'
            }`}
            title="Toggle authorized worksite geofence boundaries"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Geofences</span>
          </button>

          <button
            type="button"
            onClick={handleFitAllPins}
            className="civic-btn-secondary px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Smoothly zoom to frame all worker pins"
          >
            <LocateFixed className="w-3.5 h-3.5 text-[#1b4332]" />
            <span>Fit All</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            className="civic-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Locate my position with high-precision GNSS hardware"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span>{isLocatingUser ? 'Locking...' : 'Locate Me'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleExpand}
            className="civic-btn-secondary p-1.5 text-xs font-bold cursor-pointer"
            title={isExpanded ? 'Exit full view' : 'Expand map workspace'}
            aria-label={isExpanded ? 'Minimize map' : 'Expand map'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Locate status banner */}
      {locateStatus && (
        <div className="mb-3 px-3 py-1.5 bg-[#eff6ff] border border-[#3b82f6] rounded text-xs font-mono font-bold text-[#1d4ed8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span>{locateStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocateStatus(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split Fluid Layout: Interactive Pin Directory + Smooth Leaflet Viewport */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${isExpanded ? 'flex-1 min-h-0' : ''}`}>
        {/* Left Pin Directory with Smooth Fly-To Controls */}
        <div className="lg:col-span-4 flex flex-col border border-[#1c2421]/25 rounded-md bg-[#fcfbf7] overflow-hidden">
          <div className="p-2.5 border-b border-[#1c2421]/15 space-y-2 bg-[#f7f3e8]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3d4a44]" />
              <input
                type="text"
                value={pinSearch}
                onChange={(e) => setPinSearch(e.target.value)}
                placeholder="Search site, worker, slip..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#1c2421]/30 rounded text-xs font-semibold text-[#19231f] focus:outline-none focus:border-[#1b4332]"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'verified', 'pending', 'disputed'] as PinStatusFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-2 py-1 text-[11px] font-bold rounded capitalize cursor-pointer whitespace-nowrap transition-colors ${
                    statusFilter === f
                      ? 'bg-[#1b4332] text-white'
                      : 'bg-white text-[#3d4a44] border border-[#1c2421]/20 hover:bg-[#ede8d8]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1c2421]/10 max-h-[340px] lg:max-h-[410px]">
            {positionedLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#3d4a44] font-medium">
                No geotagged muster pins match this filter.
              </div>
            ) : (
              positionedLogs.map((item) => {
                const { log, rawLat, rawLng } = item;
                const cat = getLogCategory(log);
                const selected = activeSite?.id === log.id;
                return (
                  <button
                    key={log.id}
                    type="button"
                    onMouseEnter={() => setHoveredLogId(log.id)}
                    onMouseLeave={() => setHoveredLogId(null)}
                    onClick={() => handleFlyToPin(item)}
                    className={`w-full text-left p-2.5 transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                      selected ? 'bg-[#e8f5e9]' : 'hover:bg-[#f4ede0]/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#19231f] truncate flex items-center gap-1.5">
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            cat === 'disputed'
                              ? 'text-[#9b2226]'
                              : cat === 'verified'
                              ? 'text-[#1b4332]'
                              : 'text-[#b45309]'
                          }`}
                        />
                        <span className="truncate">{log.location_name || 'Work Site'}</span>
                      </div>
                      <div className="text-[11px] text-[#3d4a44] font-mono mt-0.5 truncate">
                        {log.worker_name ? `${log.worker_name} · ` : ''}
                        {log.phone_number}
                      </div>
                      <div className="text-[10px] font-mono text-[#1e7587] mt-0.5 tabular-nums">
                        {rawLat.toFixed(5)}°, {rawLng.toFixed(5)}° · ±{Math.round(log.gps_accuracy_meters || 8)}m
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                        cat === 'disputed'
                          ? 'text-[#9b2226]'
                          : cat === 'verified'
                          ? 'text-[#1b4332]'
                          : 'text-[#8c6721]'
                      }`}
                    >
                      {cat}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-8 flex flex-col border border-[#1c2421]/30 rounded-md overflow-hidden bg-white relative">
          <div
            ref={mapContainerRef}
            className={`w-full z-0 ${isExpanded ? 'flex-1 min-h-[380px]' : 'h-80 sm:h-[410px]'}`}
          />

          {/* Compact Map Legend */}
          <div className="absolute top-3 left-3 z-[400] bg-[#fffdfa]/92 backdrop-blur-xs border border-[#1c2421]/40 px-2.5 py-1.5 rounded text-[11px] font-bold text-[#19231f] shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[#1b4332]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332] inline-block" />
              <span>Verified Hardware GNSS</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#b45309]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] inline-block" />
              <span>Pending Supervisor Review</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#9b2226]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9b2226] inline-block" />
              <span>Disputed / Flagged Pin</span>
            </div>
          </div>

          {/* Selection Footer Strip */}
          <div className="bg-[#faf5e8] border-t border-[#1c2421]/25 p-3 px-4 text-xs flex flex-wrap items-center justify-between gap-3 text-[#19231f]">
            <div className="flex flex-wrap items-center gap-2 font-bold text-[#3d4a44]">
              <span>{t.surveyScaleLabel}</span>
              <span className="text-[#1c2421]/30">·</span>
              <span className="text-[#1b4332]">{t.gpsProtocolActive} (Sec 63 BSA)</span>
            </div>

            {activeSite ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="text-right">
                  <span className="font-mono font-black text-[#1e7587] block">
                    {activeSite.worker_name || activeSite.phone_number} · #{activeSite.verification_token}
                  </span>
                  <span className="font-mono text-[11px] text-[#3d4a44] tabular-nums">
                    {Number(activeSite.latitude).toFixed(6)}°, {Number(activeSite.longitude).toFixed(6)}° (±
                    {activeSite.gps_accuracy_meters || 8}m)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenReceipt(activeSite)}
                  className="civic-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.viewVoucherBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourtExhibitLog(activeSite)}
                  className="civic-btn-brass px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Court Exhibit</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#3d4a44] font-semibold">
                Click any site on the directory or map to inspect forensic telemetry
              </span>
            )}
          </div>
        </div>
      </div>

      {courtExhibitLog && (
        <CourtEvidenceCertificateModal
          log={courtExhibitLog}
          onClose={() => setCourtExhibitLog(null)}
        />
      )}
    </div>
  );
};

export default LiveMap;
