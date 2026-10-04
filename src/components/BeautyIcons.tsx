import { View } from "react-native";

/**
 * Two icons no icon set ships (there is no nail-polish or eyelash glyph),
 * drawn from plain Views so they need no native SVG dependency. Both scale
 * with `size` and take a single `color`, like the vector icons they sit beside.
 */

/** A nail polish bottle: cap, neck, rounded body and a glossy highlight. */
export function NailPolishIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center" }}>
      {/* cap */}
      <View
        style={{
          position: "absolute",
          top: s * 0.0,
          width: s * 0.22,
          height: s * 0.34,
          borderRadius: s * 0.06,
          backgroundColor: color,
        }}
      />
      {/* neck */}
      <View
        style={{
          position: "absolute",
          top: s * 0.35,
          width: s * 0.11,
          height: s * 0.14,
          backgroundColor: color,
        }}
      />
      {/* body */}
      <View
        style={{
          position: "absolute",
          top: s * 0.48,
          width: s * 0.78,
          height: s * 0.5,
          borderRadius: s * 0.2,
          backgroundColor: color,
        }}
      />
      {/* gloss */}
      <View
        style={{
          position: "absolute",
          top: s * 0.57,
          left: s * 0.2,
          width: s * 0.09,
          height: s * 0.26,
          borderRadius: s * 0.045,
          backgroundColor: "#FFFFFF",
          opacity: 0.55,
        }}
      />
    </View>
  );
}

/** An eye with a fan of lashes along the upper lid. */
export function LashesIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const stroke = Math.max(1.5, s * 0.075);
  const eyeW = s * 0.8;
  const eyeH = s * 0.38;
  const cx = s / 2;
  const cy = s * 0.64; // eye centre
  const reach = s * 0.44; // centre -> lash tip
  const lashLen = s * 0.17;

  // Lashes radiate from the eye centre; each wrapper is rotated about its middle.
  const angles = [-58, -29, 0, 29, 58];

  return (
    <View style={{ width: s, height: s }}>
      {angles.map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            left: cx - stroke / 2,
            top: cy - reach,
            width: stroke,
            height: reach * 2,
            transform: [{ rotate: `${deg}deg` }],
          }}
        >
          <View
            style={{
              width: stroke,
              height: lashLen,
              borderRadius: stroke / 2,
              backgroundColor: color,
            }}
          />
        </View>
      ))}
      {/* eye outline */}
      <View
        style={{
          position: "absolute",
          left: cx - eyeW / 2,
          top: cy - eyeH / 2,
          width: eyeW,
          height: eyeH,
          borderRadius: eyeH * 1.1,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
      {/* pupil */}
      <View
        style={{
          position: "absolute",
          left: cx - s * 0.1,
          top: cy - s * 0.1,
          width: s * 0.2,
          height: s * 0.2,
          borderRadius: s * 0.1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
