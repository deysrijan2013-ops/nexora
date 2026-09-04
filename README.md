# NEXORA Business OS

## Files
- `index.html` — app shell
- `css/styles.css` — complete UI
- `js/app.js` — Supabase integration and app logic
- `supabase/schema.sql` — complete database schema

## Deploy
1. Put these files in your GitHub repository.
2. Vercel deploys the repository normally.
3. In Supabase → SQL Editor, paste and run `supabase/schema.sql`.
4. Create a user through Supabase Auth. The trigger automatically creates a business and profile.
5. Open the Vercel site.

## Important
The browser uses a Supabase publishable key only. Never put a service-role/secret key in frontend files.

## No indefinite loading
The app shell has a maximum 1.8-second boot timeout. If Supabase is slow or unavailable, the UI still opens instead of staying on a loading screen forever.
