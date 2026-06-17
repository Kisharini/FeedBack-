const geocodeCache = new Map();
const routeCache = new Map();

const hashString = (value) =>
  value.split("").reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 1), 0);

const buildFallbackCoordinates = (value) => {
  const seed = hashString(value || "fallback");
  return {
    latitude: 3.139 + ((seed % 180) - 90) * 0.00035,
    longitude: 101.6869 + ((Math.floor(seed / 7) % 180) - 90) * 0.00035,
  };
};

export const getCurrentBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );
  });

export const geocodeAddress = async (address) => {
  const normalized = address?.trim();

  if (!normalized) {
    return null;
  }

  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        normalized
      )}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const payload = await response.json();
    const match = Array.isArray(payload) ? payload[0] : null;

    if (match) {
      const coordinates = {
        latitude: Number(match.lat),
        longitude: Number(match.lon),
      };
      geocodeCache.set(normalized, coordinates);
      return coordinates;
    }
  } catch (error) {
    console.error("Failed to geocode address:", normalized, error);
  }

  const fallback = buildFallbackCoordinates(normalized);
  geocodeCache.set(normalized, fallback);
  return fallback;
};

export const fetchDrivingRoute = async (start, end) => {
  if (!start || !end) {
    return [];
  }

  const routeKey = `${start.latitude},${start.longitude}:${end.latitude},${end.longitude}`;

  if (routeCache.has(routeKey)) {
    return routeCache.get(routeKey);
  }

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
    );
    const payload = await response.json();
    const coordinates = payload?.routes?.[0]?.geometry?.coordinates;

    if (Array.isArray(coordinates) && coordinates.length > 1) {
      const route = coordinates.map(([longitude, latitude]) => [latitude, longitude]);
      routeCache.set(routeKey, route);
      return route;
    }
  } catch (error) {
    console.error("Failed to fetch route:", error);
  }

  const fallback = [
    [start.latitude, start.longitude],
    [end.latitude, end.longitude],
  ];
  routeCache.set(routeKey, fallback);
  return fallback;
};
