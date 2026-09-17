export type ClerkUserCreatedData = {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  // Set by sign-up.tsx: { role, phoneNumber, matricNo, bankName,
  // bankAccountNumber, bankAccountName }
  unsafe_metadata?: {
    role?: string;
    phoneNumber?: string;
    matricNo?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  } | null;
};

export type ClerkUserUpdatedData = ClerkUserCreatedData;

export type ClerkUserDeletedData = {
  id: string;
  deleted: boolean;
};
