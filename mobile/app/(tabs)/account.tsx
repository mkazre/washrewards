import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Car,
  ChevronRight,
  ClipboardList,
  LogOut,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradients, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Vehicle } from "@/lib/api";
import { AppLogo } from "@/components/AppLogo";
import { SkeletonCard } from "@/components/Skeleton";

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAppState();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const list = await api.vehicles.list(token);
      setVehicles(list);
    } catch {
      setVehicles(null);
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

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  }

  function confirmDelete() {
    Alert.alert(
      "Delete your account",
      "This permanently removes your personal details. Your booking history stays on record for our business/legal purposes, but will no longer be tied to your name, email or phone. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: deleteAccount },
      ]
    );
  }

  async function deleteAccount() {
    if (!token) return;
    setDeleting(true);
    try {
      await api.auth.deleteAccount(token);
      await logout();
    } catch (e) {
      Alert.alert(
        "Couldn't delete your account",
        e instanceof ApiError ? e.message : "Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.offWhite }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <AppLogo size={30} />
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        <LinearGradient colors={gradients.panelCard} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>
              {(user?.name ?? "WR").split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name ?? "Guest"}
            </Text>
            {user?.phone ? (
              <View style={styles.profileRow}>
                <Phone size={12} color={colors.mutedBlueGrey} strokeWidth={1.8} />
                <Text style={styles.profileMeta}>{user.phone}</Text>
              </View>
            ) : null}
            {user?.email ? (
              <Text style={styles.profileMeta} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.body}>
        <Pressable style={styles.linkRow} onPress={() => router.push("/bookings")}>
          <View style={styles.linkIcon}>
            <ClipboardList size={19} color={colors.blue} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>My bookings</Text>
            <Text style={styles.linkSub}>Track progress and view past washes</Text>
          </View>
          <ChevronRight size={19} color={colors.greyText3} strokeWidth={2} />
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My vehicles</Text>
          <Pressable onPress={() => router.push("/add-vehicle")} hitSlop={8}>
            <Plus size={19} color={colors.blue} strokeWidth={2.2} />
          </Pressable>
        </View>

        {loading ? (
          <SkeletonCard />
        ) : !vehicles || vehicles.length === 0 ? (
          <Pressable style={styles.emptyVehicle} onPress={() => router.push("/add-vehicle")}>
            <Plus size={18} color={colors.blue} strokeWidth={2.2} />
            <Text style={styles.emptyVehicleText}>Add your first vehicle</Text>
          </Pressable>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleRow}>
              <View style={styles.linkIcon}>
                <Car size={18} color={colors.greyText3} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>
                  {v.name || [v.make, v.model].filter(Boolean).join(" ")}
                </Text>
                <Text style={styles.linkSub}>
                  {v.plate}
                  {v.color ? ` · ${v.color}` : ""}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.linkRow} onPress={confirmLogout}>
          <View style={styles.linkIcon}>
            <LogOut size={18} color={colors.navyDeep} strokeWidth={1.8} />
          </View>
          <Text style={styles.linkTitle}>Log out</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={confirmDelete} disabled={deleting}>
          <View style={[styles.linkIcon, styles.dangerIcon]}>
            <Trash2 size={18} color="#B91C1C" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, styles.dangerText]}>
              {deleting ? "Deleting…" : "Delete account"}
            </Text>
            <Text style={styles.linkSub}>Permanently remove your personal details</Text>
          </View>
        </Pressable>

        <View style={styles.noticeRow}>
          <ShieldAlert size={14} color={colors.placeholderText} strokeWidth={1.8} />
          <Text style={styles.noticeText}>
            WashRewards SA · v1.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, padding: 22, paddingTop: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 20 },
  profileCard: {
    marginTop: 18,
    borderRadius: radii.xl,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadow.cardLift,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { color: colors.white, fontFamily: fonts.heading, fontSize: 18 },
  profileName: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  profileMeta: { color: colors.mutedBlueGrey, fontSize: 12.5, marginTop: 3 },

  body: { padding: 22 },
  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep, marginTop: 24, marginBottom: 12 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.chipBlueBg,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIcon: { backgroundColor: "#FDECEC" },
  linkTitle: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  dangerText: { color: "#B91C1C" },
  linkSub: { color: colors.greyText, fontSize: 12, marginTop: 2 },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  emptyVehicle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.chipBlueBorder,
    borderRadius: radii.lg,
    padding: 16,
  },
  emptyVehicleText: { color: colors.blue, fontFamily: fonts.headingSemi, fontSize: 13.5 },

  noticeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 },
  noticeText: { color: colors.placeholderText, fontSize: 11.5 },
});
