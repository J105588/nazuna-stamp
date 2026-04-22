import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, LocateFixed } from 'lucide-react';
import { STAMP_SPOTS, calculateDistance } from '../utils/geoUtils';

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
  const [mapCenter, setMapCenter] = useState([35.668872, 139.854878]); // Default to some spot
  const [zoom, setZoom] = useState(16);

  useEffect(() => {
    // Get initial current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          setCurrentPos(pos);
          setMapCenter(pos);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          // Fallback to first spot if geolocation fails
          const firstSpot = Object.values(STAMP_SPOTS)[0];
          if (firstSpot) {
            setMapCenter([firstSpot.lat, firstSpot.lon]);
          }
        }
      );

      // Watch position for updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error watching geolocation:", error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleRecenter = () => {
    if (currentPos) {
      setMapCenter(currentPos);
      setZoom(17);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content map-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h3>周辺マップ</h3>
        
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
            
            {/* Stamp Spots */}
            {Object.entries(STAMP_SPOTS).map(([id, spot]) => (
              <Marker 
                key={id} 
                position={[spot.lat, spot.lon]} 
                icon={spotIcon}
              >
                <Popup>
                  <div className="popup-content">
                    <strong>{spot.name}</strong>
                    <p>スタンプラリースポット</p>
                    {currentPos && (
                      <div className="distance-info">
                        現在地から: <strong>{Math.round(calculateDistance(currentPos[0], currentPos[1], spot.lat, spot.lon))}m</strong>
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
