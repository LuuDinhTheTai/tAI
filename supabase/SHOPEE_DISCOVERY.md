# tAI · Shopee Affiliate Discovery (phase 1)

## Architecture

```
Supabase Cron at 01:30 UTC / 08:30 Vietnam
  → tai-automation (authenticated scheduler)
    → Shopee Affiliate Open API productOfferV2
    → validate provenance, current offer, price, commission, link and deduplicate
    → deterministic 0–100 scoring and persistence in shopee_opportunities
    → optional top-one import when shopee_auto_import is enabled
       → generateShortLink (signed mutation)
       → verify the returned https:// affiliate short-link host
       → insert real product into public.products
       → existing Content Agent can select this product at 10:10 Vietnam
```

The React dashboard route is [Shopee Discovery](https://tai-console.pages.dev/#shopee).
The AI Live Monitor ([#live](https://tai-console.pages.dev/#live)) includes Shopee Discovery jobs.

## Official API access required

Shopee Affiliate Open API is distinct from the Shopee Seller Open Platform, and must be specifically enabled for the relevant affiliate publisher account.

Official portal: https://affiliate.shopee.vn/open_api/list

Set these **server-side** Supabase Edge Function secrets through Supabase dashboard:

- `SHOPEE_AFFILIATE_APP_ID`: Shopee Affiliate Open API App ID.
- `SHOPEE_AFFILIATE_SECRET`: the secret assigned with that App ID.

Never enter either secret in the React browser, Vite config, client env, GitHub, or ChatGPT. Both must be attached to the Supabase project used by `tai-automation`. A correctly formatted ID/Secret does not prove Shopee has authorized this account; the first live `productOfferV2` query verifies access.

The server signs **the exact JSON body** with SHA-256 of AppId + Unix timestamp + JSON body + Secret, then sends it to `https://open-api.affiliate.shopee.vn/graphql`. No scraping, cookies, or third-party market data providers.

## Enabling on the dashboard

1. Add App ID/Secret as Supabase Edge Function secrets.
2. Sign in as tAI admin and open `#shopee`.
3. Click **Tìm sản phẩm ngay** to confirm API access and request real offers (maximum three keywords, 10 offers/keyword).
4. Enable **Tự tìm offer mỗi ngày** and save to activate the 08:30 scheduled discovery for this account.
5. Optionally enable **Tự tạo link và nhập sản phẩm**. This imports a maximum of one qualifying opportunity per daily run, scoring at least 35. This action uses Shopee `generateShortLink` and requires a validated provider URL. Do not enable automatic import until the Shopee account and promotion policies are confirmed.
6. Existing tAI Agent may automatically publish from the imported product catalog according to its **separate, existing** 10:10 auto-publish settings. Auto-import does not independently post content.

Without credentials: no invented offer records, no fake affiliate links, and a manual discovery check returns `missing_credentials`.

## Data and security

Table `public.shopee_opportunities` stores owner_id, external shop:item ID, source search keyword, product data, commission, score, signed short link, status and imported product ID. The data is client **read-only** and owner-scoped by Supabase RLS. Writes use the Edge Function server role. The table is included in owner-scoped Supabase Realtime.

Supabase migrations: `supabase/shopee_discovery.sql`, `supabase/shopee_discovery_cron.sql`.

Offer discovery is distinct from personal revenue reports. Commission rate is **an advertised rate**, not earned money. Link clicks and actual commissions must be tracked in phase 2 with the Shopee conversion/validation reports, when the publisher grants their access.

## Guardrails and failure modes

- All source product URLs must use `https://shopee.vn` (or `www.shopee.vn`).
- Never guess affiliate parameters or treat an arbitrary offer URL as a confirmed short link.
- Only short URLs returned by Shopee `generateShortLink` using the publisher's signed API request can be imported.
- Expired offers and zero-commission offers are filtered out.
- Duplicate discoveries preserve rejected or already imported states. Import is designed to skip already linked products on retry.
- Status and errors are visible as `shopee_discovery` job runs. A failed API request cannot masquerade as a successful search.
- No increase in publishing limit, advertising spend, external payments or privileges.
- No API request can run before the user explicitly provides valid Shopee credentials.

## Validation

- Migration and read-only RLS grants applied.
- Cron `tai-shopee-discovery` scheduled at `30 1 * * *`.
- Adapter unit checks validate URL allowlist, normalized ID, commission rate, score limits and expired offer rejection.
- Supabase Edge Function v16+ ACTIVE, Cloudflare Pages builds using `tsc --noEmit && vite build`.
- **Live Shopee API not yet verified** until publisher Open API credentials are configured; zero discovered offers are not success data.
