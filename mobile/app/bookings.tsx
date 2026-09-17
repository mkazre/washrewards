import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Calendar, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Booking } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Upcoming",
  checked_in: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.amberText2,
  confirmed: colors.blue,
  checked_in: colors.blue,
  completed: colors.green,
  cancelled: colors.greyText3,
};

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const list = await api.bookings.list(token);
      setBookings(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.offWhite }}>
      <ScreenHeader title="My bookings" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.blue}
          />
        }
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !bookings || bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            message="Book a wash from the home screen and it'll show up here."
          />
        ) : (
          bookings.map((b) => (
            <Pressable
              key={b.id}
              style={styles.row}
              onPress={() => router.push({ pathname: "/booking-detail", params: { id: String(b.id) } })}
            >
              <View style={styles.rowTop}>
                <Text style={styles.tenantName} numberOfLines={1}>
                  {b.tenant?.name ?? "Booking"}
                </Text>
                <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] ?? colors.greyText3 }]}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </Text>
              </View>
              <Text style={styles.serviceName}>{b.service?.name ?? "—"}</Text>
              <View style={styles.rowBottom}>
                <Calendar size={13} color={colors.placeholderText} strokeWidth={1.8} />
                <Text style={styles.dateText}>
                  {new Date(b.scheduled_at).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.priceText}>
                  {b.total_amount != null ? `R${b.total_amount}` : ""}
                </Text>
                <ChevronRight size={16} color={colors.greyText3} strokeWidth={2} style={{ marginLeft: "auto" }} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tenantName: { flex: 1, fontFamily: fonts.headingSemi, fontSize: 14.5, color: colors.navyDeep },
  statusText: { fontFamily: fonts.headingSemi, fontSize: 11.5 },
  serviceName: { color: colors.greyText, fontSize: 12.5, marginTop: 4 },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  dateText: { color: colors.placeholderText2, fontSize: 12 },
  metaDot: { color: "#D2D8E0" },
  priceText: { color: colors.navyDeep, fontFamily: fonts.headingSemi, fontSize: 12.5 },
});
