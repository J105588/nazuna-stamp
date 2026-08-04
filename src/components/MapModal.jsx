import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, LocateFixed } from 'lucide-react';
import { calculateDistance } from '../utils/geoUtils';
import { stampDb } from '../utils/stampDb';

// Fix for Leaflet default icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom Icon for Stamp Spots (Enji colored)
const spotIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #9b2d30; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom Icon for Current Location (Blue Pulsing)
const currentPosIcon = new L.DivIcon({
  className: 'current-pos-icon',
  html: `<div class="pulse-wrapper"><div class="pulse-dot"></div><div class="pulse-ring"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to handle map centering
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapModal({ onClose }) {
  const [currentPos, setCurrentPos] = useState(null);
  const [mapCenter, setMapCenter] = useState([35.6812, 139.7671]);
  const [zoom, setZoom] = useState(14);
  const [isLocating, setIsLocating] = useState(true);
  const [locatingError, setLocatingError] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const loadMapData = async () => {
      const cps = await stampDb.getCheckpointsAsync();
      const secs = await stampDb.getSectionsAsync();
      setCheckpoints(cps);
      setSections(secs);

      if (cps.length > 0) {
        setMapCenter([cps[0].lat, cps[0].lon]);
        setZoom(16);
      }
    };
    loadMapData();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    let watchId;

    const requestLocation = () => {
      if (!navigator.geolocation) {
        setIsLocating(false);
        return;
      }

      setIsLocating(true);
      setLocatingError(false);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          setCurrentPos(pos);
          setMapCenter(pos);
          setZoom(16);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setIsLocating(false);
          setLocatingError(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error watching geolocation:", error),
        { enableHighAccuracy: true }
      );
    };

    requestLocation();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleRecenter = () => {
    if (currentPos) {
      setMapCenter(currentPos);
      setZoom(16);
    }
  };

  const getSectionName = (sectionId) => {
    const sec = sections.find(s => s.id === sectionId);
    return sec ? sec.name : '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content map-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h3>周辺マップ (駅・エリア別スポット)</h3>
        
        <div className="map-wrapper">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView center={mapCenter} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dynamic Stamp Spots from DB (No checkpoint names used) */}
            {checkpoints.map((cp, idx) => (
              <Marker 
                key={cp.id} 
                position={[cp.lat, cp.lon]} 
                icon={spotIcon}
              >
                <Popup>
                  <div className="popup-content">
                    {cp.sectionId && (
                      <span className="popup-sec-tag">{getSectionName(cp.sectionId)}</span>
                    )}
                    <strong>{cp.name || `スポット ${idx + 1}`}</strong>
                    <p>{cp.description || 'スタンプラリーポイント'}</p>
                    {currentPos && (
                      <div className="distance-info">
                        現在地から: <strong>{Math.round(calculateDistance(currentPos[0], currentPos[1], cp.lat, cp.lon))}m</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Current Position */}
            {currentPos && (
              <Marker position={currentPos} icon={currentPosIcon}>
                <Popup>現在地</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Locating Overlay */}
          {isLocating && (
            <div className="map-loading-overlay">
              <div className="loading-spinner-wrapper">
                <LocateFixed className="spin-icon" size={32} />
                <p>現在地を取得中...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isLocating && locatingError && !currentPos && (
            <div className="map-error-notice">
              <Navigation size={16} />
              <span>現在地を取得できませんでした</span>
            </div>
          )}

          <button className="recenter-btn" onClick={handleRecenter} title="現在地へ移動">
            <LocateFixed size={20} />
          </button>
        </div>

        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-icon spot"></div>
            <span>スタンプポイント</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon current"></div>
            <span>現在地</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapModal;
