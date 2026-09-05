# Bizora

A clean, Supabase-backed business management and billing web app.

## Files
- `index.html` — application shell
- `css/styles.css` — responsive light/dark UI
- `js/app.js` — Supabase auth, business data and billing logic
- `supabase/schema.sql` — matching database schema + RLS + signup trigger

## Supabase setup
1. Open Supabase SQL Editor.
2. For a **new/empty project**, run `supabase/schema.sql` once.
3. In Authentication → Providers, enable Google/GitHub if you want social sign-in.
4. Add your Vercel production URL to Authentication → URL Configuration.
5. The frontend uses only the Supabase publishable key; never add a service-role/secret key.

### Existing database
The application expects the exact tables and `business_id` columns in the included schema. If your existing database contains old/incompatible tables, use a fresh Supabase project for this launch or perform a deliberate migration. Do not randomly drop production data.

## Vercel
Deploy the repository as a static site:
- Framework: Other
- Build command: blank
- Output directory: blank
- Root directory: repository root

## Included features
- Email/password signup and login
- Google/GitHub OAuth buttons
- Automatic business workspace creation after signup
- Sales and purchase records
- Inventory/products
- Customers and manufacturers
- Payments and expenses
- Market records
- Analytics
- Business branding and logo upload
- Printable invoice / Word-compatible browser output
- Excel inventory export
- Light/dark mode
- Responsive mobile navigation
- Row Level Security by business

## Important
This is a solid small-business starter, not legal/accounting advice. Configure invoice/tax requirements for your jurisdiction before commercial use.