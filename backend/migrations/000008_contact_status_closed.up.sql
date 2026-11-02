-- The admin inbox can close a conversation; the enum only had new/read/replied.
ALTER TYPE contact_status ADD VALUE IF NOT EXISTS 'closed';
