const matchFoodListings = (userPreferences, listings) => {
  const { userLocationText, preferredTypes = [], neededQuantity, userRole } = userPreferences;
  const now = new Date();

  return listings
    .map((listing) => {
      const expiryTime = new Date(listing.expiryAt);
      if (expiryTime <= now) return null;

      if (userRole === "NGO" && listing.type !== "DONATION") return null;
      if (userRole === "INDIVIDUAL" && listing.type !== "DISCOUNTED") return null;

      let proximityScore = 0.1;
      if (userLocationText && listing.location) {
        const userLoc = userLocationText.toLowerCase().trim();
        const itemLoc = listing.location.toLowerCase().trim();

        if (itemLoc === userLoc) {
          proximityScore = 1.0;
        } else if (itemLoc.includes(userLoc) || userLoc.includes(itemLoc)) {
          proximityScore = 0.7;
        }
      }

      const hoursToExpiry = (expiryTime - now) / (1000 * 60 * 60);
      let expiryScore = 0.1;
      if (hoursToExpiry <= 6) expiryScore = 1.0;
      else if (hoursToExpiry <= 24) expiryScore = 0.7;
      else if (hoursToExpiry <= 72) expiryScore = 0.4;

      const typeMatch = preferredTypes.some(
        (type) =>
          listing.title.toLowerCase().includes(type.toLowerCase()) ||
          listing.description.toLowerCase().includes(type.toLowerCase())
      );
      const foodTypeScore = typeMatch ? 1.0 : 0.2;

      const quantityRatio = listing.quantity / neededQuantity;
      const quantityScore = quantityRatio >= 1 ? 1.0 : quantityRatio;

      const finalScore = Math.round(
        (proximityScore * 0.35 +
          expiryScore * 0.3 +
          foodTypeScore * 0.2 +
          quantityScore * 0.15) *
          100
      );

      return {
        ...listing,
        matchScore: finalScore,
        distanceKM: null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = {
  matchFoodListings,
};
