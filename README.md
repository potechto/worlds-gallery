# Worlds Gallery V5 — Geo Explorer / VS Code project

**Local interactive prototype. Not deployed. Not connected to Supabase or GitHub.**

## 1. Fastest way to preview

Double-click `Worlds_Gallery_V5_Preview.html` in Microsoft Edge or Chrome. It is a self-contained offline preview: galaxy/Earth texture, the interface, maps, sample stories, collages and filters all work without a server. Only optional Wikimedia Commons *place photos* need an internet connection.

The ZIP contains all local code and visual assets necessary for this offline experience. Local fallback maps are used whenever external photographs are unavailable. Do not mistake the fallback map for a photo of a landmark.

## 2. Open in VS Code

Extract the contents of the ZIP **directly** to:

`C:\Users\Ralph John\OneDrive\Desktop\ME FILES\worlds gallery`

Then **VS Code → File → Open Folder → select that path**. The project should contain `index.html`, `styles.css`, `portal.css`, `app.js`, `portal.js`, `earth_bluemarble.jpg`, `ph_coastline.js` and other files directly in the selected folder — no additional nested project folder.

For a development server, use the VS Code *Live Server* extension, then open `index.html`. Or, if Python is installed, run `python -m http.server 5500` from the project folder and visit `http://localhost:5500`. The server is optional for the standalone preview.

**To rebuild the single-file preview** after editing: run `python build_standalone.py`. The command writes `Worlds_Gallery_V5_Preview.html` in the same directory. The standalone preview embeds the local Earth texture and all JavaScript/CSS, but curated Commons photos remain optional online images.

## 3. What V5 changes

- Preserves V4 full-screen Earth-first entrance, animated starfield, day/night atmosphere, world clock and original gallery.
- Replaces decorative polygon art used for the Philippines with coastlines derived from real GSHHG geographic data, plus province/city map focus and accurate anchor coordinates for Bataan and Hermosa.
- Country → island group → region → province → municipality navigation, with per-level map focus.
- Adds curated educational landmark cards for Philippines, Luzon, Visayas, Mindanao, Central Luzon, Bataan, and Hermosa with photographs hosted on Wikimedia Commons when the browser is online, with author/license links. Uncurated localities show a clear 'not yet curated' state, not invented descriptions or photographs.
- Adds direct OpenStreetMap links centered near a geographic feature when available. The link needs internet; no OpenStreetMap tiles are bundled.
- Hides visible scrollbar chrome while preserving scroll behavior.
- Keeps the 1–4-photo collage layouts, photo modal, 14 themes, multi-select theme chips, search, hearts, feedback animation, and 1,000-character upload rule.
- Improves Web Speech API voice prioritization (prefer built-in English voices named Natural/Neural and softer female-sounding voices) and adds narration pace control. Stop/play restarts at the title.

## 4. Geographic accuracy and limitations

- **The coastal outlines ARE geographic data, not hand-drawn shapes.** GSHHG shorelines are intermediate-resolution, simplified for screen performance. Shoreline detail is better than V4, but coastlines still differ slightly from high-resolution maps.
- **Political/admin boundaries are NOT implied by the coastlines.** Regional, provincial and municipal map focus is indicated by location pins. When geoBoundaries ADM1/2/3 data is present, verified geometries can be displayed. The initial ZIP deliberately does NOT invent precise polygon outlines for subdivisions.
- **Optional accurate PH administrative boundaries:** After extracting and with internet access, run `python tools/fetch_ph_boundaries.py`; this fetches open `geoBoundaries` simplified geometry for ADM1 (regions), ADM2 (provinces), ADM3 (municipalities where available) and generates `ph_admin_geo.js`. Refresh the page to see outlines when names match uniquely. Some names/levels may not match the user-friendly list; avoid treating this demonstration as cadastral/legal mapping. Validate against official PSA Philippine Standard Geographic Code (PSGC), especially for 2026 changes.
- No detailed administrative boundary geometry for every country is bundled. The entire country directory remains discoverable; globally complete city-level geometry is a separate data/licensing undertaking.
- NASA Blue Marble Earth texture is geographically grounded but not Google Earth or a live satellite imagery service. The globe picking layer uses Natural Earth simplified country polygons; tiny islands may require the country search bar.
- Some top-level Philippine geographic feature groupings reflect explanatory, not administrative, island-group classifications (Luzon, Visayas, Mindanao).

## 5. Educational photo highlights

The photo cards use *specific curated Wikimedia Commons file pages* and display source author + CC license. These photographs are **NOT embedded in the offline ZIP**, because this environment could not retrieve binary image files. Photo loading and hotlink behavior depend on browser/network access. The local layout always has a graceful fallback. To use all photos offline, download/rehost only under their confirmed license terms, maintain attribution and share-alike obligations where applicable, and update `place_highlights.js` URLs.

## 6. Narration limitations

The Web Speech API costs nothing in this demo, but the final voice is provided by the browser/operating system. Even with better selection and adjusted pace, it cannot reliably produce high-quality *expressive AI narration* across all devices, particularly for mixed Filipino-English stories. For consistently humanlike emotional narration, a proper voice-model integration, licensed voice assets, caching and usage controls may later be required (possibly paid). V5 does not upload stories to a voice provider.

## 7. Not a production launch

No real authentication, cloud upload, moderation workflow, privacy controls, legal mapping verification, Supabase database, GitHub repository, or public hosting. Keep the browser-only demo private until review and safety work are complete. Sample stories are fictional. Browser uploads are local to that browser and subject to storage limitations.

## Files

- `index.html` — editable HTML entry point.
- `styles.css`, `portal.css` — gallery + cosmic/local exploration styling.
- `app.js`, `globe.js`, `portal.js` — interactive controls, gallery, Earth-first entry.
- `data.js`, `world_geometry.js`, `timezones.js`, `ph_coastline.js`, `ph_admin_geo.js`, `place_highlights.js` — geographic and demo data.
- `earth_bluemarble.jpg` — bundled local NASA-derived globe texture.
- `Worlds_Gallery_V5_Preview.html` — self-contained browser demo (except optional online Commons photographs).
- `build_standalone.py` — rebuild helper.
- `tools/fetch_ph_boundaries.py` — optional downloader of real geographic administrative boundaries.
- `LICENSES_AND_SOURCES.md` — source and asset attribution.

All changes since V4 are additive or focused replacements of the simplified map content. If you use GitHub later, first commit this working version before wiring production data.
