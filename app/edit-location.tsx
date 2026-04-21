import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { MapPin, NavigationArrow, Trash } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { requestLocationPermission, getCurrentPosition, reverseGeocode } from "@/services/locationService";
import { t } from "@/i18n";

export default function EditLocationScreen() {
  const { state, dispatch, refreshWeather } = useWeatherContext();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGps = async () => {
    setLoading(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(t("editLocation.permNeeded"), t("editLocation.permDesc"));
        return;
      }
      const pos = await getCurrentPosition();
      if (!pos) return;
      const name = await reverseGeocode(pos.lat, pos.lon);
      const id = `gps-${Date.now()}`;
      const existingGps = state.locations.find((l) => l.isGps);
      if (existingGps) {
        dispatch({ type: "REMOVE_LOCATION", payload: { locationId: existingGps.id } });
      }
      dispatch({
        type: "ADD_LOCATION",
        payload: { location: { id, name, lat: pos.lat, lon: pos.lon, isGps: true } },
      });
      showToast(TOAST.LOCATION_ADDED(name));
      await refreshWeather();
    } catch {
      Alert.alert(t("editLocation.error"), t("editLocation.errorDesc"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (id: string) => {
    const loc = state.locations.find((l) => l.id === id);
    if (loc) {
      dispatch({ type: "SET_LOCATION", payload: { location: loc } });
      showToast(TOAST.LOCATION_SELECTED(loc.name));
    }
  };

  const handleRemoveLocation = (id: string) => {
    if (state.locations.length <= 1) {
      Alert.alert(t("editLocation.cantDelete"), t("editLocation.cantDeleteDesc"));
      return;
    }
    dispatch({ type: "REMOVE_LOCATION", payload: { locationId: id } });
    showToast(TOAST.LOCATION_REMOVED);
  };

  return (
    <ScreenSheet title={t("editLocation.title")}>
      {/* GPS 버튼 */}
      <Pressable onPress={handleGps} disabled={loading} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gpsBtn}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <NavigationArrow size={20} weight="fill" color={COLORS.white} />
              <Text style={styles.gpsBtnText}>{t("editLocation.updateGps")}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* 저장된 위치 목록 */}
      <Text style={styles.sectionTitle}>{t("editLocation.saved")}</Text>
      {state.locations.map((loc) => (
        <View key={loc.id} style={[styles.locationRow, loc.id === state.currentLocationId && styles.locationRowActive]}>
          <Pressable
            onPress={() => handleSelectLocation(loc.id)}
            style={styles.locationInfo}
          >
            <View style={[styles.locationIcon, loc.isGps && styles.locationIconGps]}>
              {loc.isGps ? (
                <NavigationArrow size={16} weight="fill" color={COLORS.primary} />
              ) : (
                <MapPin size={16} weight="fill" color={COLORS.textMuted} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <Text style={styles.locationCoord}>
                {loc.isGps ? t("editLocation.gps") : `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}
              </Text>
            </View>
            {loc.id === state.currentLocationId && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t("editLocation.active")}</Text>
              </View>
            )}
          </Pressable>
          {!loc.isGps && (
            <Pressable
              onPress={() => handleRemoveLocation(loc.id)}
              style={styles.deleteBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              accessibilityLabel={t("editLocation.deleteLabel")}
            >
              <Trash size={16} color={COLORS.warn} />
            </Pressable>
          )}
        </View>
      ))}

      {state.locations.length === 0 && (
        <View style={styles.emptyState}>
          <MapPin size={40} color={COLORS.borderMedium} />
          <Text style={styles.emptyText}>{t("editLocation.empty")}</Text>
          <Text style={styles.emptySub}>{t("editLocation.emptySub")}</Text>
        </View>
      )}
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  gpsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 20,
  },
  gpsBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 12, letterSpacing: 0.3 },
  locationRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC",
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 10, overflow: "hidden",
  },
  locationRowActive: { borderColor: COLORS.primary, backgroundColor: "rgba(74,144,217,0.06)" },
  locationInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  locationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.textLight, alignItems: "center", justifyContent: "center" },
  locationIconGps: { backgroundColor: "rgba(74,144,217,0.08)" },
  locationName: { fontSize: 15, fontWeight: "600", color: COLORS.textDark },
  locationCoord: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  activeBadge: { backgroundColor: "rgba(74,144,217,0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: "600", color: COLORS.textSecondary, marginTop: 12 },
  emptySub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
