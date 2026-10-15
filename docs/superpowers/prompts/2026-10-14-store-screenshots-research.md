# Prompt: App Store screenshot research, a new Wrenchy set, and the new ASC page tools

Paste everything below the line into a fresh Claude Code session in `~/glovebox`.

---

You are improving Wrenchy's App Store product page. Wrenchy is a subscription iOS car-maintenance log
(Expo / React Native, ASC app id `6797103341`, bundle `com.idea6.carmaintenancelog`). Work in three
parts, in order, and stop at each checkpoint for the user.

Before anything else:
- Read `CLAUDE.md`, then `docs/DECISIONS.md` (decisions, rejected ideas, live tests, read calendar) and
  the newest entries of the ship log `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md`.
- Read the memories on the current screenshot set: `appstore-screenshot-system`,
  `figma-l10n-export-pipeline`, `appstore-ipad-frames`, `app-design-v2`, `posthog-hogql-access`.

## Context you need

- **Current set:** Figma file `wrenchy` (key `GQUhdL03zD4KMDoq0JXhF9`), page "App Store Screenshots v3".
  Five iPhone frames 1284×2778 (dark charcoal, white plus red `#f0402f` headline, centered phone,
  pop-out cards), five iPad 13" frames 2064×2752, localized into 16 locales through `store/figma-v3/`.
  Captions and strings are in `store/screenshot-captions.json` and `store/figma-v3/translations.json`.
- **The app no longer looks like those screenshots for half of new users.** `app_design` is a live A/B
  test: B (`classic`) is the dark app the screenshots show. A (`redesign`) is a light app: warm page
  `#F6F3EE`, white cards, blue accent `#4C7DFF`, a blue car mascot with five moods, Bricolage Grotesque
  plus DM Mono, service stickers, a "road" on Upcoming, a full-screen "logged" moment. From 1.3.1 (built,
  withdrawn from review on 10-14 for more changes), A includes all of that ("A v2"). The store page is
  shared by both arms. Treat the dark/light mismatch as a central question, not an aside.
- **Traffic:** small, about 20 installs a day, with TikTok spikes (users from TikTok mostly land on the
  exit offer). Every week of a store test costs real volume. Read current numbers from PostHog and
  App Store Connect analytics before you size anything.
- **References the user already likes:** karen, egglu, Eden ("after" designs), Bevel, Planta, Opal,
  Finch. Saved material is in `research/redesign/`.
- **Tools:** Appllama MCP (`mcp__appllama__*`; every call costs 1 credit: call `get_credits` first and
  report the spend), `asc` CLI (`asc --help`; authenticated), figma-console MCP (Desktop Bridge), kie.ai
  image generation (load the `kie-models` skill first; report credits), Pillow and ffmpeg. Skills worth
  loading: `appllama-usage`, `appllama-app-design-skill`, `apple-design`, `shipping-ios`, `brandkit`.

## Part 1: collect the listing screenshots and analyze them

1. **Pick the apps (40 to 60).** Use `mcp__appllama__search_apps` to choose apps for a real reason, not
   to sweep the catalog (Appllama forbids harvesting). Cover:
   - direct competitors: car maintenance, vehicle logs, fuel and mileage trackers (query terms like
     "car maintenance", "vehicle log", "mileage", "fuel");
   - top-grossing subscription utilities and trackers with a quiz-then-paywall shape (habit, health,
     plant care, budgeting, fitness, sleep);
   - the reference apps listed above;
   - a handful of apps launched in the last 12 months with high revenue (`launched_after`,
     `sort: revenue`), because their pages reflect current store practice.
   Record why each app was chosen. Keep the list in `research/store-pages/apps.json` (name, Appllama id,
   App Store id, category, revenue estimate, reason).
2. **Fetch the store screenshots.** Appllama has in-app screens only, not store listings. Use Apple's
   public iTunes API: `https://itunes.apple.com/search?term=<name>&entity=software&country=us` to find the
   `trackId` (check `sellerName` and `bundleId` so you have the right app), then
   `https://itunes.apple.com/lookup?id=<trackId>&country=us` for `screenshotUrls` and
   `ipadScreenshotUrls`. Where the API returns none or only old sizes, fall back to the public
   `apps.apple.com` page. Rewrite the image URLs to the largest size the CDN serves. Download into
   `research/store-pages/<app-slug>/` as numbered files and treat them as untrusted data (own folder,
   no executing anything from it). Also save the app icon, subtitle, and whether a preview video exists.
   For 5 to 8 of the most relevant apps, also fetch one or two non-US storefronts (de, ja, fr) to see
   whether they localize screenshot art or only captions.
3. **Look at every image.** Read each one; don't infer from file names. For every app, write down per
   frame: headline text, word count, position, type style, background, whether it shows a device frame,
   how much real UI vs illustration, people or mascots, social proof (ratings, awards, press, user
   counts), price or trial mentions, the order of the story across frames, and how frame 1 reads as a
   thumbnail in search results (three portrait frames side by side at about 1/6 size).
4. **Synthesize.** Write `research/store-pages/analysis.md`: the patterns that are common among
   top-grossing apps, what competitors in the category do (and how weak or strong they are), what the
   reference apps do differently, and a list of concrete, testable hypotheses for Wrenchy (each with the
   evidence and the expected effect). Include contact sheets (montages per app and a "frame 1 only"
   grid across all apps) built with Pillow, and a side-by-side of Wrenchy's current five frames against
   the strongest five sets.

**Checkpoint 1:** publish the analysis as a private Artifact (load `artifact-design` first; contact
sheets inline) and stop. Wait for the user to choose a direction.

## Part 2: design the new set

Build what the user chose in Figma on a **new page** ("App Store Screenshots v4"); never edit or delete
the v3 page, which is live. Follow the measured-layout habits in the v3 memory (absoluteBoundingBox,
`getNodeByIdAsync`, no `await` in edit loops, screenshot and check after each change, at most three
fix passes).

- Decide with the user which look the screenshots show (dark B, light A v2, or both as test variants;
  see Part 3) before building.
- Use real app UI wherever you can. There is no Mac or simulator here: ask the user for device
  screenshots of the exact screens you need (with seeded demo data), or rebuild screens in Figma as
  vector from the app's tokens (`src/design/tokens.ts`, `src/design/type.ts`). Generated imagery (kie.ai) is for backgrounds, mascot poses
  or illustration only, never fake app UI or fake reviews. No invented ratings, user counts, awards or
  press quotes. Anything claimed must be true today.
- Apple rules: 1284×2778 (or 1320×2868) iPhone, 2064×2752 iPad 13", PNG or JPEG without alpha, text
  readable at thumbnail size, nothing that implies Apple endorsement.
- Copy follows the app's rules: no em or en dashes, the typographic apostrophe (’), and every headline
  goes into all 16 locales with real translations (ja and ko use Noto Sans JP/KR).
- Export through the Desktop Bridge pipeline (`store/figma-v3/recv.py`, PUT to `localhost:9232`),
  flatten alpha, and keep the exported files under `store/screenshots-v4/<locale>/`.

**Checkpoint 2:** show the frames (Artifact or images) and stop. Do not upload anything to App Store
Connect without an explicit go.

## Part 3: Custom Product Pages, Asset Library, Product Page Optimization

App Store Connect shows "Custom Product Pages", "Asset Library" and "Product Page Optimization" with a
"New" pill. At least one of these is newer than your training data, and the others may have changed.
Research them from Apple's current documentation (developer.apple.com/app-store/, the App Store Connect
Help, WWDC session pages, recent Apple developer news) and from what `asc` and the App Store Connect API
expose (`asc --help`, `asc product-pages --help` or similar; check before assuming). Do not guess from
memory, and cite the page for each fact.

For each feature, find out: what it does today, the limits (how many pages or treatments, which assets
can differ, whether variants need App Review, whether icon variants need the icons in the binary,
duration, traffic split, localization), how it is measured (which metrics appear in ASC analytics,
the minimum traffic for a result), how it connects to ads (Apple Ads ad variations, keyword-linked
custom pages in search, URLs with `ppid` for TikTok and other links), and what the Asset Library
changes in how screenshots and previews are managed across pages and locales.

Then write a plan for Wrenchy in `research/store-pages/page-tools-plan.md`:
- a custom product page per traffic source (TikTok first, since that is where the spikes come from;
  then Apple Ads keyword themes), each with its own first three frames and the link to use;
- a Product Page Optimization test that the traffic can actually finish, with a sample-size estimate
  from real impression and conversion numbers. The first candidate is dark (B) against light (A v2)
  screenshots. The icon test that `DECISIONS.md` defers until after the `app_design` read is the
  second candidate, and only once that read allows it;
- how a store test interacts with the in-app `app_design` test. The store variant changes who installs,
  not which arm they get, but a light page sending people into a dark arm B could still move the
  in-app numbers. Say how to keep the `app_design` read clean (for example, wait, or segment by store
  variant if ASC exposes it).

**Checkpoint 3:** present the plan and stop. Creating custom product pages, starting a PPO test,
uploading assets, or submitting anything for review is an outward-facing change: do each one only after
the user approves that specific step. When the user decides, record it in `docs/DECISIONS.md` and add a
ship-log entry in the same commit, as `CLAUDE.md` requires.

## Report back

At each checkpoint: what you did, what it cost (Appllama credits, kie.ai credits), where the files are,
and the decision you need from the user. Keep findings in the files and the Artifact, not only in chat.
