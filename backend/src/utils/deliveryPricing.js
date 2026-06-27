const DELIVERY_PRICING = {
  // Keep pricing deliberately below typical mainstream delivery-app ranges.
  baseFeeAmount: 250,
  perKilometerAmount: 70,
  peakHourSurchargeAmount: 100,
  extraPickupStopAmount: 75,
  minimumFeeAmount: 350,
  fallbackFeeAmount: 550,
  peakWindows: [
    { startHour: 12, endHour: 14 },
    { startHour: 18, endHour: 20 },
  ],
  timeZone: "Asia/Kuala_Lumpur",
};

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (start, end) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
};

const getMalaysiaHour = (date) => {
  const formattedHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: DELIVERY_PRICING.timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return Number(formattedHour);
};

const isPeakHour = (date) => {
  const hour = getMalaysiaHour(date);
  return DELIVERY_PRICING.peakWindows.some(
    (window) => hour >= window.startHour && hour < window.endHour
  );
};

const roundCurrencyAmount = (value) => Math.round(value);

const normalizePickupPoints = (pickupPoints = []) =>
  pickupPoints.filter(
    (point) => isFiniteNumber(point?.latitude) && isFiniteNumber(point?.longitude)
  );

const calculateDeliveryFeeEstimate = ({
  deliveryOption,
  pickupPoints = [],
  deliveryCoordinates = null,
  now = new Date(),
}) => {
  if (deliveryOption !== "DELIVERY") {
    return {
      amount: 0,
      pricingMode: "pickup",
      breakdown: {
        baseFeeAmount: 0,
        distanceFeeAmount: 0,
        peakHourSurchargeAmount: 0,
        extraPickupSurchargeAmount: 0,
        extraPickupStops: 0,
        chargeableDistanceKm: 0,
        peakHourApplied: false,
      },
    };
  }

  const validPickupPoints = normalizePickupPoints(pickupPoints);

  if (
    !isFiniteNumber(deliveryCoordinates?.latitude) ||
    !isFiniteNumber(deliveryCoordinates?.longitude) ||
    validPickupPoints.length === 0
  ) {
    return {
      amount: DELIVERY_PRICING.fallbackFeeAmount,
      pricingMode: "fallback",
      breakdown: {
        baseFeeAmount: DELIVERY_PRICING.fallbackFeeAmount,
        distanceFeeAmount: 0,
        peakHourSurchargeAmount: 0,
        extraPickupSurchargeAmount: 0,
        extraPickupStops: Math.max(validPickupPoints.length - 1, 0),
        chargeableDistanceKm: 0,
        peakHourApplied: false,
      },
    };
  }

  const chargeableDistanceKm = Math.max(
    ...validPickupPoints.map((pickupPoint) =>
      haversineDistanceKm(pickupPoint, deliveryCoordinates)
    )
  );
  const extraPickupStops = Math.max(validPickupPoints.length - 1, 0);
  const distanceFeeAmount = roundCurrencyAmount(
    chargeableDistanceKm * DELIVERY_PRICING.perKilometerAmount
  );
  const peakHourApplied = isPeakHour(now);
  const peakHourSurchargeAmount = peakHourApplied
    ? DELIVERY_PRICING.peakHourSurchargeAmount
    : 0;
  const extraPickupSurchargeAmount =
    extraPickupStops * DELIVERY_PRICING.extraPickupStopAmount;

  const rawAmount =
    DELIVERY_PRICING.baseFeeAmount +
    distanceFeeAmount +
    peakHourSurchargeAmount +
    extraPickupSurchargeAmount;

  return {
    amount: Math.max(rawAmount, DELIVERY_PRICING.minimumFeeAmount),
    pricingMode: "dynamic",
    breakdown: {
      baseFeeAmount: DELIVERY_PRICING.baseFeeAmount,
      distanceFeeAmount,
      peakHourSurchargeAmount,
      extraPickupSurchargeAmount,
      extraPickupStops,
      chargeableDistanceKm: Number(chargeableDistanceKm.toFixed(2)),
      peakHourApplied,
    },
  };
};

module.exports = {
  DELIVERY_PRICING,
  calculateDeliveryFeeEstimate,
};
