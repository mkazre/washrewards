import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Bell, Check } from "lucide-react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, NotificationItem } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
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
      const list = await api.notifications.list(token);
      setItems(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    if (!token) return;
    try {
      await api.notifications.markAllRead(token);
      load();
    } catch {
      // best-effort
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.offWhite }}>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.back()}
        right={
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
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
        ) : !items || items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            message="Booking updates and reward alerts will show up here."
          />
        ) : (
          items.map((n) => (
            <View key={n.id} style={styles.row}>
              <View style={styles.iconWrap}>
                {n.read ? (
                  <Check size={19} color={colors.greyText3} strokeWidth={2} />
                ) : (
                  <Bell size={19} color={colors.blue} strokeWidth={2} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.body} numberOfLines={3}>
                  {n.body}
                </Text>
                <Text style={styles.time}>
                  {new Date(n.created_at).toLocaleString()}
                </Text>
              </View>
              {!n.read ? <View style={styles.unreadDot} /> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  markAll: { color: "#7E9BE0", fontSize: 12.5, fontFamily: fonts.headingSemi },
  row: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.chipBlueBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  body: { color: colors.greyText, fontSize: 12.5, marginTop: 3, lineHeight: 18 },
  time: { color: colors.placeholderText2, fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 4 },
});
