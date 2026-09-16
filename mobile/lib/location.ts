import * as Location from "expo-location";

/**
 * Best-effort device location. Returns null on denial/error rather than
 * throwing — callers fall back to the backend's unfiltered,
 * rating-sorted list, exactly as if this were never called.
 */
export async function getDeviceLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
