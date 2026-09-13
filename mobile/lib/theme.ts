/**
 * Design tokens ported from WashRewards SA.dc.html
 * Navy dark surfaces, amber/gold accent, blue primary actions.
 */
export const colors = {
  navy: "#091830",
  navyDeep: "#0B1626",
  navyPanelFrom: "#0E2347",
  navyPanelMid: "#13294f",
  navyPanelTo: "#1d3470",
  gold: "#F59E0B",
  goldLight: "#FBBF24",
  blue: "#2463EB",
  blueDark: "#1d54ce",
  blueDeep: "#1b3f9e",
  white: "#fff",
  offWhite: "#F5F6F8",
  mutedBlueGrey: "#9DB0D4",
  mutedBlueGrey2: "#7E8DA6",
  mutedBlueGrey3: "#6E80A0",
  greyText: "#6B7787",
  greyText2: "#8A95A3",
  greyText3: "#5C6B7D",
  greyBorder: "#E2E6EC",
  greyBorderLight: "#EEF0F4",
  greyBorderLight2: "#ECEEF2",
  greyBg: "#FAFBFC",
  greyBg2: "#F1F3F6",
  greyBg3: "#EAEDF2",
  chipBlueBg: "#EEF3FF",
  chipBlueBorder: "#CFE0FF",
  amberBg: "#FFF7E8",
  amberBorder: "#F4E3BE",
  amberText: "#7A5A1E",
  amberText2: "#B45309",
  amberSoftFrom: "#FEF3DC",
  amberSoftTo: "#FDE9BE",
  greenBg: "#E7F6EC",
  green: "#16A34A",
  green2: "#34D399",
  placeholderText: "#9AA5B1",
  placeholderText2: "#A6B0BC",
  divider: "#F2F4F7",
  dashedBorder: "#D8DEE7",
} as const;

export const gradients = {
  splash: ["#091830", "#0e2347", "#123163"] as const,
  heroCard: ["#0E2347", "#13294f", "#1d3470"] as const,
  panelCard: ["#0E2347", "#1d3470"] as const,
  blueButton: ["#2463EB", "#1b3f9e"] as const,
  goldButton: ["#F59E0B", "#FBBF24"] as const,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  round: 24,
  pill: 999,
};

export const fonts = {
  heading: "SpaceGrotesk_700Bold",
  headingSemi: "SpaceGrotesk_600SemiBold",
  headingMed: "SpaceGrotesk_500Medium",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
};

export const shadow = {
  card: {
    shadowColor: "#091830",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLift: {
    shadowColor: "#091830",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  panel: {
    shadowColor: "#091830",
    shadowOpacity: 0.3,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  button: {
    shadowColor: "#2463EB",
    shadowOpacity: 0.34,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
};
