import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campuses, categories } from "@/db/schema";

/** Offering-type-aware validation shared by the submit route. */

export type OfferingType = "product" | "service" | "courier";
export type VehicleMode = "car" | "bicycle" | "foot";

export type ApplicationInput = {
  offeringType: OfferingType;
  displayName: string;
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  categoryId?: string | null;
  vehicleMode?: VehicleMode | null;
  campusId: string;
  address?: string | null;
  description?: string | null;
  coverPhotoUrl?: string | null;
  shopIconUrl?: string | null;
  govIdUrl?: string | null;
  selfieUrl?: string | null;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

const OFFERING_TYPES: OfferingType[] = ["product", "service", "courier"];
const VEHICLE_MODES: VehicleMode[] = ["car", "bicycle", "foot"];

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Validate + normalise a raw submit body. Returns `{ ok, value }` or
 * `{ ok: false, error }` with a user-facing message.
 */
export async function parseApplicationInput(
  raw: unknown,
): Promise<
  { ok: true; value: ApplicationInput } | { ok: false; error: string }
> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid body." };
  }
  const b = raw as Record<string, unknown>;

  const offeringType = b.offeringType as OfferingType;
  if (!OFFERING_TYPES.includes(offeringType)) {
    return { ok: false, error: "Pick a valid offering type." };
  }

  const displayName = str(b.displayName);
  const campusId = str(b.campusId);
  const bankName = str(b.bankName);
  const bankAccountNumber = str(b.bankAccountNumber);
  const bankAccountName = str(b.bankAccountName);

  if (!displayName) return { ok: false, error: "A display name is required." };
  if (!campusId) return { ok: false, error: "Choose a campus." };
  if (!bankName || !bankAccountNumber || !bankAccountName) {
    return { ok: false, error: "Complete the bank details." };
  }
  if (!/^\d{10}$/.test(bankAccountNumber)) {
    return { ok: false, error: "Account number must be 10 digits." };
  }

  const categoryId = str(b.categoryId);
  const vehicleMode = b.vehicleMode as VehicleMode | undefined;
  const address = str(b.address);

  if (offeringType === "product") {
    if (!categoryId) return { ok: false, error: "Choose a product category." };
    if (!address) return { ok: false, error: "A shop / stand address is required." };
  }
  if (offeringType === "service" && !categoryId) {
    return { ok: false, error: "Choose a service type." };
  }
  if (offeringType === "courier") {
    if (!vehicleMode || !VEHICLE_MODES.includes(vehicleMode)) {
      return { ok: false, error: "Choose how you'll get around." };
    }
  }

  // Referential checks.
  const [campus] = await db
    .select({ id: campuses.id })
    .from(campuses)
    .where(eq(campuses.id, campusId))
    .limit(1);
  if (!campus) return { ok: false, error: "That campus doesn't exist." };

  if (categoryId) {
    const [cat] = await db
      .select({ id: categories.id, kind: categories.kind })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!cat) return { ok: false, error: "That category doesn't exist." };
    const wantKind = offeringType === "service" ? "service" : "product";
    if (cat.kind !== wantKind) {
      return { ok: false, error: "That category is the wrong kind." };
    }
  }

  return {
    ok: true,
    value: {
      offeringType,
      displayName,
      ownerName: str(b.ownerName),
      phone: str(b.phone),
      email: str(b.email),
      categoryId: offeringType === "courier" ? null : categoryId,
      vehicleMode: offeringType === "courier" ? (vehicleMode ?? null) : null,
      campusId,
      address,
      description: str(b.description),
      coverPhotoUrl: str(b.coverPhotoUrl),
      shopIconUrl: offeringType === "product" ? str(b.shopIconUrl) : null,
      govIdUrl: str(b.govIdUrl),
      selfieUrl: str(b.selfieUrl),
      bankName,
      bankAccountNumber,
      bankAccountName,
    },
  };
}
