# Sweetwater Landscapes — Site Roadmap & Change Log

Running log of what's been built, why, and what's planned next. Update this file with every meaningful change so the history stays in one place.

Live site: https://tfarmonov.github.io/sweetwater/

---

## Change log

### 2026-07-30 — Phase 3: Case studies, sustainability, service areas + site-wide imagery

**New pages**
- `case-studies.html` — Three metric-driven case studies (coastal HOA recovery, corporate campus 28% water reduction, 214-lot builder development) with challenge/approach/result structure and stat tiles.
- `sustainability.html` — Water stewardship, IPM, native/pollinator plantings, battery-equipment pilot; the page national commercial players (BrightView, Davey) lead with.
- `service-areas.html` — Custom NC service-region map, town-by-town coverage chips for both regions, and City-level `areaServed` structured data (local SEO).

**Imagery**
- Built an original SVG illustration system (`images/`): 13 scene illustrations (entrance, before/after pair, mowing, irrigation, mulch, wood/aluminum fencing, crew, campus, pollinator garden, stormwater pond, community street) plus a custom NC service map — all in the brand palette, generated programmatically for consistency.
- **Why illustrations, not stock photos:** this build environment's network policy blocks all stock-photo hosts (Unsplash, Pexels, Wikimedia, Openverse), so no photography could be downloaded. All artwork is original (zero licensing risk). Every image sits in a normal `<img>`/background slot with descriptive alt text — drop real photos over the same filenames and the whole site updates.
- Generated `images/og-card.png` (1200×630) and wired `og:image` + `twitter:card summary_large_image` on every page for social sharing.
- Integrated site-wide: hero-adjacent scene banners on 7 pages, gallery tiles replaced with captioned images, before/after slider now uses matching before/after scenes, homepage division cards got image headers.

**Navigation**
- Re-grouped nav for 16 pages: Services (5), Work (Gallery / Case studies / Reviews), Company (Team / Sustainability / Careers), Resources (3); footer expanded to five columns.
- Sitemap expanded to 16 URLs.

### 2026-07-01 — Phase 2: Scale-up feature build

Modeled on the feature sets of national landscaping leaders (BrightView, Yellowstone Landscape, TruGreen) while keeping the site's unique topographic/waterline design language.

**New pages**
- `plans.html` — Three maintenance tiers (Essential / Signature / Estate), a side-by-side comparison table, and an **instant estimate calculator** (maintenance $/mo by square footage, tier, and add-ons; fencing project totals by material, linear feet, and gates). Fires `estimate_calculated` dataLayer events.
- `industries.html` — Industries-served page (HOA, builders/developers, corporate, retail/mixed-use, military/government, healthcare) with a "why property managers switch" section.
- `careers.html` — Benefits grid, five open roles, hiring-process sidebar, and an application form (front-end demo). Includes JobPosting structured data for Google Jobs.
- `resources.html` — Interactive NC seasonal grounds calendar (Spring/Summer/Fall/Winter tab switcher) plus three SEO content guides: mulch vs. pine straw, irrigation startup/winterization, fence material selection.
- `faq.html` — 10-question accordion with matching FAQPage structured data (rich-result eligible).
- `portal.html` — Client portal preview: sign-in card, demo request-tracking dashboard, feature list. Positioned as launching to Signature/Estate clients.

**Sitewide upgrades**
- New dropdown navigation (Services / Company / Resources groups) with a persistent gold "Instant estimate" CTA; mobile menu regrouped with section labels.
- New 4-column footer with full NAP (name/address/phone) for both offices — local SEO signal on every page.
- **Google Tag Manager slots**: clearly marked paste-here comment blocks in the `<head>` and after `<body>` of every page. Site pushes these dataLayer events for GTM triggers: `form_submit`, `phone_click`, `cta_click`, `division_select`, `estimate_calculated`, `season_guide_view`, `job_application`.
- Homepage: animated count-up hero stats, scrolling client-type ticker, 4-step "How we work" process section, industries strip, second CTA to the estimate calculator.
- Gallery: interactive drag before/after comparison slider.
- Contact form now pushes `form_submit` to the dataLayer.

**SEO added this phase**
- BreadcrumbList structured data on all new pages.
- Service structured data on `services.html` and `fencing.html` (service type + area served).
- FAQPage structured data on `faq.html`; JobPosting structured data on `careers.html`.
- ~2,500 words of original, NC-specific content (seasonal calendar + guides) targeting long-tail queries like "mulch vs pine straw NC" and "fescue overseeding triangle".
- Internal linking web between plans ↔ industries ↔ contact ↔ resources; sitemap.xml expanded to all 13 pages.

### 2026-07-01 — Phase 1: Initial import + SEO baseline

- Imported the 7-page site export (index, services, fencing, photos, team, reviews, contact + styles.css/site.js) into the repo.
- Added canonical URLs, Open Graph + Twitter Card meta, and robots meta to every page.
- Added Organization + two-office HomeAndConstructionBusiness structured data to the homepage.
- Created `sitemap.xml` (footer previously linked to a missing file), `robots.txt`, and a branded SVG favicon.
- Published to GitHub Pages via the `main` branch.

---

## Manual setup still needed (owner actions)

- [ ] **Google Tag Manager**: create a GTM container, then paste the two snippets into the marked comment blocks on each page (head snippet + body noscript snippet). The dataLayer events listed above are already firing.
- [ ] **Google Search Console**: verify the site and submit `sitemap.xml`.
- [ ] **Google Business Profile**: link the two office profiles; update the review-page `g.page` links if they change.
- [ ] Replace the illustrated scenes in `images/` with real project photography (keep the same filenames and every page updates automatically; keep dimensions near 1200×750).
- [ ] Wire the contact / careers forms to a real backend (Formspree, Netlify Forms, or a small API) — they are front-end demos right now.
- [ ] If a custom domain (e.g., sweetwaternc.com) is adopted: add a `CNAME` file and find-replace `https://tfarmonov.github.io/sweetwater` across all pages + sitemap.

## Planned next (Phase 3 candidates)

- Real client portal backend (auth, request tracking, invoices).
- Case-study pages with per-project metrics (good for both sales and long-tail SEO).
- Blog/news collection with dated posts for recurring seasonal content.
- Online payment link for maintenance invoices.
- Spanish-language landing page (`/es/`) — bilingual crews are already a hiring point.
- Photo/video gallery CMS integration so the team can update without editing HTML.
