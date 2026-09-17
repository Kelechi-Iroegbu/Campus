import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { uploadImage } from "@/lib/imagekit";

// Cap the long edge — without this, a modern phone camera's full-resolution
// photo (often 10-20+ MB) gets uploaded as-is, which is what was making
// uploads slow. 1440px is plenty for any in-app display size; ImageKit's own
// URL transforms handle further resizing on read.
const MAX_DIMENSION = 1440;

/**
 * Pick a photo from the library and upload it to ImageKit. Returns the hosted
 * URL (or null if cancelled / failed). Used for product photos and the vendor
 * cover photo.
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(
    async (opts?: { aspect?: [number, number] }): Promise<string | null> => {
      setError(null);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError("Photo-library permission is needed to add an image.");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        // Android's cropper relies on a system "crop" Intent that most modern
        // devices don't ship an app for — the crop screen opens with no
        // controls and never resolves. iOS's built-in editor is reliable.
        allowsEditing: Platform.OS === "ios",
        aspect: opts?.aspect ?? [4, 3],
        quality: 0.7,
      });
      if (result.canceled) return null;

      const asset = result.assets[0];
      if (!asset) return null;

      setUploading(true);
      try {
        let uri = asset.uri;
        let type = asset.mimeType ?? "image/jpeg";
        const longEdge = Math.max(asset.width, asset.height);
        if (longEdge > MAX_DIMENSION) {
          const resizeTo =
            asset.width >= asset.height
              ? { width: MAX_DIMENSION }
              : { height: MAX_DIMENSION };
          const resized = await manipulateAsync(asset.uri, [{ resize: resizeTo }], {
            compress: 0.7,
            format: SaveFormat.JPEG,
          });
          uri = resized.uri;
          type = "image/jpeg";
        }

        const name =
          asset.fileName ?? `upload_${Date.now()}.${uri.split(".").pop() ?? "jpg"}`;
        const out = (await uploadImage({ uri, name, type })) as {
          url?: string;
        };
        if (!out?.url) throw new Error("Upload returned no URL");
        return out.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { pickAndUpload, uploading, error };
}
