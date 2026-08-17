const URL_ENDPOINT = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const PUBLIC_KEY = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

type Transform = Record<string, string | number>;

export function getImageUrl(path: string, transforms?: Transform) {
  const tr = transforms
    ? Object.entries(transforms)
        .map(([key, value]) => `${key}-${value}`)
        .join(",")
    : undefined;

  const url = new URL(path.replace(/^\/+/, ""), `${URL_ENDPOINT}/`);
  if (tr) url.searchParams.set("tr", tr);
  return url.toString();
}

export async function uploadImage(file: {
  uri: string;
  name: string;
  type: string;
}) {
  const authRes = await fetch("/api/imagekit-auth");
  const { token, expire, signature } = await authRes.json();

  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  form.append("fileName", file.name);
  form.append("publicKey", PUBLIC_KEY);
  form.append("token", token);
  form.append("expire", String(expire));
  form.append("signature", signature);

  const uploadRes = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    { method: "POST", body: form },
  );

  if (!uploadRes.ok) {
    throw new Error(`ImageKit upload failed: ${await uploadRes.text()}`);
  }

  return uploadRes.json();
}
