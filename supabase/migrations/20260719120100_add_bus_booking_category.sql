-- Applied to project ojwxetjlxqhjtltuycml ("Freedom Plan") via Supabase MCP.
-- Reproduce with: supabase db push  (or run these files in order against psql)
--
-- Split into its own migration because ALTER TYPE ... ADD VALUE can't run in
-- the same transaction as statements that reference the new value.

-- Allow bus bookings to be recorded directly rather than disguised as "other".
alter type spain_travel_companion.booking_category add value if not exists 'bus';
