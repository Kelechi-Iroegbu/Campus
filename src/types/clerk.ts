export type ClerkUserCreatedData = {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

export type ClerkUserUpdatedData = ClerkUserCreatedData;

export type ClerkUserDeletedData = {
  id: string;
  deleted: boolean;
};
