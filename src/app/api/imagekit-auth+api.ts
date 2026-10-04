import ImageKit from "imagekit";
import { withApi } from "@/lib/apiHandler";

const imagekit = new ImageKit({
  publicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export const GET = withApi(async () => {
  return Response.json(imagekit.getAuthenticationParameters());
});
