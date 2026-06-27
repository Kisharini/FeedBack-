import { apiRequest, jsonRequest } from "./api";
import { getToken } from "./auth";

const withToken = (options = {}) => ({
  token: getToken(),
  ...options,
});

const requestCache = new Map();
const inFlightRequests = new Map();

const getRequestCacheKey = (path) => `${getToken() || "guest"}:${path}`;

const readCachedResponse = (cacheKey) => {
  const cachedEntry = requestCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() > cachedEntry.expiresAt) {
    requestCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.value;
};

const runCachedGet = async (path, ttlMs = 5000) => {
  const cacheKey = getRequestCacheKey(path);
  const cachedValue = readCachedResponse(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = apiRequest(path, withToken())
    .then((response) => {
      requestCache.set(cacheKey, {
        value: response,
        expiresAt: Date.now() + ttlMs,
      });
      inFlightRequests.delete(cacheKey);
      return response;
    })
    .catch((error) => {
      inFlightRequests.delete(cacheKey);
      throw error;
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

const clearMarketplaceCache = () => {
  requestCache.clear();
  inFlightRequests.clear();
};

export const fetchListings = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return runCachedGet(
    `/marketplace/listings${queryString ? `?${queryString}` : ""}`,
    10000
  );
};

export const fetchListingById = (listingId) =>
  runCachedGet(`/marketplace/listings/${listingId}`, 10000);

export const checkoutOrder = (body) =>
  jsonRequest("/marketplace/orders/checkout", {
    method: "POST",
    body,
    ...withToken(),
  }).then((response) => {
    clearMarketplaceCache();
    return response;
  });

export const estimateDeliveryFee = (body) =>
  jsonRequest("/marketplace/orders/delivery-fee-estimate", {
    method: "POST",
    body,
    ...withToken(),
  });

export const fetchOrders = () => runCachedGet("/marketplace/orders", 5000);

export const fetchOrderById = (orderId) =>
  runCachedGet(`/marketplace/orders/${orderId}`, 3000);

export const confirmPickupOrder = (orderId) =>
  jsonRequest(`/marketplace/orders/${orderId}/confirm-pickup`, {
    method: "POST",
    body: {},
    ...withToken(),
  }).then((response) => {
    clearMarketplaceCache();
    return response;
  });
