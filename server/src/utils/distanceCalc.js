/**
 * Distance Calculation Utilities (Maritime Demo Calculations)
 * Uses standard Haversine formula on spherical Earth model.
 * 1 Nautical Mile (NM) = 1.852 km.
 */

const EARTH_RADIUS_KM = 6371;
const KM_TO_NM = 1 / 1.852;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate great-circle distance between two coordinates in Nautical Miles (NM).
 */
function haversineDistanceNm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;
  return Number((distanceKm * KM_TO_NM).toFixed(2));
}

/**
 * Calculate total route distance in NM across origin, waypoints, and destination.
 */
function calculateRouteDistanceNm(origin, waypoints = [], destination) {
  if (!origin || !destination) return 0;
  const points = [origin, ...waypoints, destination].filter((p) => p && p.lat != null && p.lng != null);
  if (points.length < 2) return 0;

  let totalNm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalNm += haversineDistanceNm(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
  }
  return Number(totalNm.toFixed(2));
}

/**
 * Estimate minimum distance in NM from a vessel position to a route polyline.
 * Evaluates perpendicular or vertex distance to each segment.
 */
function distanceToPolylineNm(point, polyline) {
  if (!point || !polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) {
    return haversineDistanceNm(point.lat, point.lng, polyline[0].lat, polyline[0].lng);
  }

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];

    // Distance to segment endpoints
    const d1 = haversineDistanceNm(point.lat, point.lng, p1.lat, p1.lng);
    const d2 = haversineDistanceNm(point.lat, point.lng, p2.lat, p2.lng);
    const segDist = haversineDistanceNm(p1.lat, p1.lng, p2.lat, p2.lng);

    // Approximate distance to segment
    let d = Math.min(d1, d2);
    if (segDist > 0) {
      // Check projection
      const midLat = (p1.lat + p2.lat) / 2;
      const midLng = (p1.lng + p2.lng) / 2;
      const dMid = haversineDistanceNm(point.lat, point.lng, midLat, midLng);
      d = Math.min(d, dMid);
    }

    if (d < minDistance) {
      minDistance = d;
    }
  }

  return Number(minDistance.toFixed(2));
}

/**
 * Calculate heading (bearing) between two points in degrees (0-359)
 */
function calculateHeading(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

module.exports = {
  haversineDistanceNm,
  calculateRouteDistanceNm,
  distanceToPolylineNm,
  calculateHeading,
};
