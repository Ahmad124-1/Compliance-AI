/**
 * Unit Conversion Engine
 * Handles conversions between common units for carbon accounting.
 */

const CONVERSION_FACTORS: Record<string, Record<string, number>> = {
  mass: {
    kg: 1,
    tonnes: 1000,
    metric_tonnes: 1000,
    g: 0.001,
    lb: 0.453592,
  },
  energy: {
    kwh: 1,
    mwh: 1000,
    mj: 0.277778,
    gj: 277.7778,
    btu: 0.000293071,
  },
  volume: {
    liters: 1,
    gallons: 3.78541,
    cubic_meters: 1000,
    cubic_feet: 28.3168,
  },
  distance: {
    km: 1,
    miles: 1.60934,
    m: 0.001,
  },
};

export const unitConversionService = {
  /**
   * Convert a value from one unit to another within the same category.
   * @returns The converted value, or null if conversion is not possible.
   */
  convert(value: number, fromUnit: string, toUnit: string): number | null {
    // Try mass
    const massFrom = CONVERSION_FACTORS.mass[fromUnit.toLowerCase()];
    const massTo = CONVERSION_FACTORS.mass[toUnit.toLowerCase()];
    if (massFrom !== undefined && massTo !== undefined) {
      return (value * massFrom) / massTo;
    }

    // Try energy
    const energyFrom = CONVERSION_FACTORS.energy[fromUnit.toLowerCase()];
    const energyTo = CONVERSION_FACTORS.energy[toUnit.toLowerCase()];
    if (energyFrom !== undefined && energyTo !== undefined) {
      return (value * energyFrom) / energyTo;
    }

    // Try volume
    const volFrom = CONVERSION_FACTORS.volume[fromUnit.toLowerCase()];
    const volTo = CONVERSION_FACTORS.volume[toUnit.toLowerCase()];
    if (volFrom !== undefined && volTo !== undefined) {
      return (value * volFrom) / volTo;
    }

    // Try distance
    const distFrom = CONVERSION_FACTORS.distance[fromUnit.toLowerCase()];
    const distTo = CONVERSION_FACTORS.distance[toUnit.toLowerCase()];
    if (distFrom !== undefined && distTo !== undefined) {
      return (value * distFrom) / distTo;
    }

    return null;
  },

  /**
   * Convert mass (kg ↔ tonnes)
   */
  kgToTonnes(kg: number): number {
    return kg / 1000;
  },

  tonnesToKg(tonnes: number): number {
    return tonnes * 1000;
  },

  /**
   * Convert energy (kWh ↔ MWh)
   */
  kWhToMWh(kwh: number): number {
    return kwh / 1000;
  },

  mwhToKWh(mwh: number): number {
    return mwh * 1000;
  },

  /**
   * Convert volume (Liters ↔ Gallons)
   */
  litersToGallons(liters: number): number {
    return liters / 3.78541;
  },

  gallonsToLiters(gallons: number): number {
    return gallons * 3.78541;
  },

  /**
   * Convert distance (km ↔ miles)
   */
  kmToMiles(km: number): number {
    return km / 1.60934;
  },

  milesToKm(miles: number): number {
    return miles * 1.60934;
  },

  /**
   * Convert energy (MJ ↔ GJ)
   */
  mjToGj(mj: number): number {
    return mj / 1000;
  },

  gjToMj(gj: number): number {
    return gj * 1000;
  },

  /**
   * Get all supported units grouped by category
   */
  getSupportedUnits() {
    return {
      mass: Object.keys(CONVERSION_FACTORS.mass),
      energy: Object.keys(CONVERSION_FACTORS.energy),
      volume: Object.keys(CONVERSION_FACTORS.volume),
      distance: Object.keys(CONVERSION_FACTORS.distance),
    };
  },
};
