export const MAX_DISTANCE_METERS = 15;

// Define specific stamp spots with coordinates.
// In reality, this would be fetched from a DB or config based on the QR code data.
export const STAMP_SPOTS = {
  "spot-1": { name: "チェックポイント1", lat: 35.681236, lon: 139.767125 },
  "spot-2": { name: "チェックポイント2", lat: 35.682000, lon: 139.768000 },
  "spot-3": { name: "チェックポイント3", lat: 35.683000, lon: 139.769000 },
};

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}
