/**
 * Light -> dark colour map for the student-facing screens.
 *
 * Only *structural* colours are listed (page and card backgrounds, tinted
 * chips, text greys, borders). Brand orange and the vivid category/status
 * accents are deliberately absent: they read fine on both themes and stay put.
 *
 * Keys are the light hex the screens already use, upper-case. This one table
 * feeds both the `dark:` class variants (added by a build-time codemod) and
 * the runtime `t()` helper in `useTheme()` for colours set from JS.
 */
export const DARK_PALETTE: Record<string, string> = {
  // Page backgrounds
  "#FBF3EC": "#15120F",
  "#FBF7F2": "#15120F",
  "#F7F3EF": "#1A1613",
  "#F0E9DE": "#2A241F",

  // Cards / surfaces (`bg-white` maps to WHITE_SURFACE_DARK below)
  "#FFFFFF": "#201B17",

  // Tinted chips and surfaces
  "#FBEFE7": "#2A2019",
  "#FDE9D5": "#3A2718",
  "#FCDCC4": "#41291A",
  "#FCE7EC": "#3A1F28",
  "#E1F3E3": "#1F3325",
  "#DFF3E5": "#1F3325",
  "#E4F4E6": "#1F3325",
  "#E8F5E9": "#1F3325",
  "#FBE1D2": "#3A2419",
  "#FBCBA8": "#553019",
  "#F3E8DD": "#2B2621",
  "#F1E4DA": "#2B2420",
  "#E4D8CC": "#3A322B",
  "#E6F0FF": "#1E2A3F",
  "#E0DAD1": "#3A342E",
  "#EBD9C8": "#3A302A",
  "#F1E9E0": "#2A2520",
  "#F6F0E9": "#231E1A",
  "#FDE7D9": "#3A2519",
  "#E7D6C6": "#3A322B",
  "#FCEFE6": "#2B211A",
  "#FBEAD9": "#33261C",
  "#FBDCC7": "#4A2E1E",
  "#F6D9B8": "#4A3826",
  "#F1ECE1": "#2B2721",
  "#EEE7DC": "#2B2721",
  "#FFF6F1": "#2A211B",
  "#E7E7E7": "#332D28",
  "#DDF3E3": "#1F3325",
  "#F2D8C8": "#3A2B22",
  "#F7D2DC": "#3A2129",
  "#E4DACE": "#3A322B",
  "#FBE1D9": "#3A2419",
  "#FBEFD9": "#33281C",
  "#FDEAE0": "#3A2519",
  "#F6DCC3": "#41301F",
  "#FDECE4": "#3A2419",
  "#F3C9B8": "#553019",
  "#E9E4FB": "#2A2440",
  "#FBE1E1": "#3A2222",
  "#EEEAE4": "#2E2A26",

  // Text
  "#1F1F1F": "#F3EEE8",
  "#111111": "#F5F0EA",
  "#8A8A8A": "#A39A91",
  "#6B6B6B": "#B0A79E",
  "#5C5C5C": "#B8B0A7",
  "#555A65": "#B7BAC2",
  "#8A7A6E": "#B0A296",
  "#7A6A5C": "#B0A296",
  "#B8AC9C": "#8C8278",
  "#B0A597": "#8C8278",
  "#C9C0B4": "#6F675F",
  "#C4BEB4": "#6F675F",
  "#D8CDBF": "#6A625A",
  "#5C4A3D": "#C9B8A8",
  "#5C2412": "#F4D4BF",
  "#B4AEA4": "#7C736B",
  "#B8B0A4": "#7C736B",
  "#3A3A3A": "#D8D2CB",
  "#14142B": "#F3EEE8",
  "#BEB7AC": "#6F675F",

  // Accent text that needs a lift on dark backgrounds
  "#B9722E": "#E0A15E",
  "#C7345F": "#F0668F",
  "#D64524": "#FF7050",
  "#E8491D": "#FF6A45",
  "#3FA65A": "#5BC078",
  "#2E9E4F": "#54C077",
  "#E24C4C": "#FF7373",
  "#2E8B4E": "#54C077",

  // Borders / dividers
  "#F0EAE3": "#2E2924",
  "#EFEAE2": "#2E2924",
  "#EFEAE3": "#2E2924",
  "#EAE0D6": "#2E2924",
  "#EDE4D9": "#2E2924",
  "#F1ECE4": "#2E2924",
  "#EFEFEF": "#2E2924",
  "#ECE7DF": "#2E2924",
  "#F1EEEA": "#2E2924",
  "#C9BFB2": "#4A423A",
};

/** What `bg-white` becomes on dark backgrounds. */
export const WHITE_SURFACE_DARK = "#201B17";

/** Page background for each theme, for native chrome (tab bar, stack bg). */
export const PAGE_BG = { light: "#FBF3EC", dark: "#15120F" } as const;
