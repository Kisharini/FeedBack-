export function matchFoodListings(userPreferences, listings) {
    const { userLocationText, preferredTypes = [], neededQuantity, userRole } = userPreferences;
    const NOW = new Date();

    return listings
      .map((listing) => {
        const expiryTime = new Date(listing.expiryAt);
        if (expiryTime <= NOW) return null;

        // Role-based filtering
        if (userRole === "NGO" && listing.type !== "DONATION") return null;
        if (userRole === "INDIVIDUAL" && listing.type !== "DISCOUNTED") return null;
        
        // 1. Text-Based Proximity Score 
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

        // 2. Expiration urgency score
        const hoursToExpiry = (expiryTime - NOW) / (1000 * 60 * 60);
        let expiryScore = 0;
        if (hoursToExpiry <= 6) expiryScore = 1.0;
        else if (hoursToExpiry <= 24) expiryScore = 0.7;
        else if (hoursToExpiry <= 72) expiryScore = 0.4;
        else expiryScore = 0.1;

        // 3. Food type relevance
        const typeMatch = preferredTypes.some(type => 
          listing.title.toLowerCase().includes(type.toLowerCase()) || 
          listing.description.toLowerCase().includes(type.toLowerCase())
        );
        const foodTypeScore = typeMatch ? 1.0 : 0.2;

        // 4. Quantity fit score
        const qtyratio = listing.quantity / neededQuantity;
        let quantityScore = 0;
        if (qtyratio >= 1) quantityScore = 1.0;
        else quantityScore = qtyratio;

        // Calculate final percentage score 
        const finalScore = Math.round(
          (proximityScore * 0.35 + 
           expiryScore * 0.30 + 
           foodTypeScore * 0.20 + 
           quantityScore * 0.15) * 100
        );

        return {
            ...listing,
            matchScore: finalScore,
            distanceKM: null
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore);
}