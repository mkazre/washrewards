import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { colors } from "@/lib/theme";
import type { AppConfig, Tenant } from "@/lib/api";

// No Mapbox account/token involved — MapLibre is the open-source renderer,
// and the style/tiles it loads come from Amazon Location Service (see the
// styleUrl below), not Mapbox's service.
MapLibreGL.setAccessToken(null);

const FALLBACK_CENTER: [number, number] = [28.0473, -26.2041]; // Johannesburg

interface Props {
  maps: NonNullable<AppConfig["maps"]>;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
}

export function NearbyMap({ maps, tenants, onSelectTenant }: Props) {
  const styleUrl = useMemo(
    () =>
      `https://maps.geo.${maps.region}.amazonaws.com/maps/v0/maps/${maps.map_name}/style-descriptor?key=${maps.api_key}`,
    [maps]
  );

  const located = tenants.filter(
    (t): t is Tenant & { latitude: number; longitude: number } =>
      t.latitude != null && t.longitude != null
  );

  const center: [number, number] = located.length
    ? [
        located.reduce((sum, t) => sum + t.longitude, 0) / located.length,
        located.reduce((sum, t) => sum + t.latitude, 0) / located.length,
      ]
    : FALLBACK_CENTER;

  return (
    <View style={styles.wrap}>
      <MapLibreGL.MapView style={styles.map} mapStyle={styleUrl} logoEnabled={false}>
        <MapLibreGL.Camera zoomLevel={11} centerCoordinate={center} />
        {located.map((tenant) => (
          <MapLibreGL.PointAnnotation
            key={String(tenant.id)}
            id={`tenant-${tenant.id}`}
            coordinate={[tenant.longitude, tenant.latitude]}
            onSelected={() => onSelectTenant(tenant)}
          >
            <View style={styles.pin}>
              <View style={styles.pinDot} />
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 260,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3E8EF",
  },
  map: { flex: 1 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
});
