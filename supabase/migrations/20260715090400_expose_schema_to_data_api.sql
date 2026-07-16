-- Adds spain_travel_companion to the Data API's exposed schema list without
-- disturbing the existing ones (this Supabase project also hosts unrelated
-- "mlb" and other apps). Equivalent to toggling it on in
-- Project Settings -> API -> Exposed schemas in the dashboard.
alter role authenticator set pgrst.db_schemas = 'public, mlb, graphql_public, spain_travel_companion';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
