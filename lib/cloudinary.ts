import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export { cloudinary };

export async function uploadImage(
  file: string,
  folder: string = "kiddie-chic"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    // width/crop cap keeps the stored master reasonable (product photos are
    // never shown wider than ~1600px anywhere on the site) without touching
    // quality — only affects new uploads, existing Cloudinary assets are untouched.
    transformation: [{ quality: "auto", fetch_format: "auto", width: 1600, crop: "limit" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getUploadSignature(folder: string = "kiddie-chic") {
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
    folder,
  };
}

export function publicIdFromUrl(url: string): string | null {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || idx === -1) return null;
  let rest = url.slice(idx + marker.length);
  // drop leading version segment vNNN/ if present
  rest = rest.replace(/^v\d+\//, "");
  // drop file extension
  return rest.replace(/\.[a-z0-9]+$/i, "");
}
