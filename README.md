# Bizora — Public Business Management App

Bizora is a production-oriented static web app for small and growing businesses.

## Included
- Day / night mode
- Email/password authentication
- Google and GitHub OAuth buttons
- Business profile and branding
- Business logo for invoices
- Sales, purchases, inventory, customers, manufacturers, payments, expenses and market records
- Printable Word-compatible invoice export (`.doc`) and Excel inventory export (`.xlsx`)
- Responsive desktop/mobile UI
- Supabase Row Level Security by business

## 1. Supabase
1. Create/use a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. For Google/GitHub login, go to Authentication → Providers and enable the providers you want.
5. Add your Vercel URL to Authentication → URL Configuration → Redirect URLs.
6. Never put a Supabase secret/service-role key in this frontend.

### Important for an existing database
This schema is designed for a clean setup. If your project already has an older `customers` (or other) table with different columns, do NOT blindly drop it. Either migrate it carefully or use a fresh Supabase project for the public launch.

## 2. GitHub
Put the contents of this folder at the repository root:

```text
index.html
css/styles.css
js/app.js
supabase/schema.sql
README.md
```

`index.html` must be in the root.

## 3. Vercel
Import the same GitHub repository.

- Framework Preset: Other
- Root Directory: `./`
- Build Command: leave blank
- Output Directory: leave blank

Deploy.

## 4. Branding
Open Business Settings after signing in. Add:
- Business name
- Phone
- Address
- Tax/GST number if applicable
- Official business logo
- Invoice prefix
- Bill footer

For signed bills, businesses should use their authorized signature/signing image where legally and operationally appropriate. The current bill export includes a printable signature line; a dedicated uploaded signature field can be added when you want a formal signed-invoice workflow.

## 5. Bill formats
- Word-compatible bill: Sales → Bill
- Excel: Inventory → Export Excel
- Browser print: open the generated bill and use Ctrl+P / Print.

## Public-launch checklist
- Configure OAuth providers.
- Add production redirect URLs.
- Verify RLS with two separate test accounts.
- Configure a custom domain in Vercel.
- Add your privacy policy, terms, support contact and company/legal details.
- Test invoice/tax requirements for your jurisdiction.
- Consider moving logo/signature files to a private Supabase Storage bucket rather than storing data URLs in database rows as the product scales.