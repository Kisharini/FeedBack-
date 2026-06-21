const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
const DEFAULT_COUNTRY = import.meta.env.VITE_MAPBOX_COUNTRY || "MY";
const DEFAULT_LANGUAGE = import.meta.env.VITE_MAPBOX_LANGUAGE || "en";

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

export const isAddressAutocompleteEnabled = () => Boolean(MAPBOX_ACCESS_TOKEN);

export const createAddressSessionToken = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchAddressSuggestions = async (
  query,
  { sessionToken, proximity, limit = 5 } = {}
) => {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery || !MAPBOX_ACCESS_TOKEN) {
    return [];
  }

  const response = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/suggest?${buildQueryString({
      q: normalizedQuery,
      limit,
      language: DEFAULT_LANGUAGE,
      country: DEFAULT_COUNTRY,
      session_token: sessionToken,
      proximity: proximity
        ? `${proximity.longitude},${proximity.latitude}`
        : undefined,
      access_token: MAPBOX_ACCESS_TOKEN,
    })}`
  );

  if (!response.ok) {
    throw new Error("Address suggestions are unavailable right now.");
  }

  const payload = await response.json();
  return Array.isArray(payload?.suggestions) ? payload.suggestions : [];
};

export const retrieveAddressSuggestion = async (mapboxId, { sessionToken } = {}) => {
  if (!mapboxId || !MAPBOX_ACCESS_TOKEN) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
      mapboxId
    )}?${buildQueryString({
      session_token: sessionToken,
      access_token: MAPBOX_ACCESS_TOKEN,
    })}`
  );

  if (!response.ok) {
    throw new Error("We could not load the selected address.");
  }

  const payload = await response.json();
  const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
  const coordinates = feature?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("The selected address did not include map coordinates.");
  }

  return {
    address: feature.properties?.full_address || feature.properties?.name || "",
    latitude: coordinates[1],
    longitude: coordinates[0],
    provider: "mapbox",
    placeId: feature.properties?.mapbox_id || mapboxId,
  };
};
