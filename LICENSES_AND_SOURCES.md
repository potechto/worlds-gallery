# Worlds Gallery V5 — geography, imagery, and licenses

## Geographic vector data

- **GSHHG** (Global Self-consistent Hierarchical High-resolution Geography): Philippine coastal outlines derived from Basemap intermediate-resolution GSHHG polygons, simplified for browser maps. Source authors: Paul Wessel and Walter H. F. Smith. NOAA info: https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html . **GSHHG is released under GNU Lesser General Public License (LGPL)**; this data attribution should be retained. These are actual shoreline contours, not administrative boundaries. Do not call them precise borders.
- **Natural Earth** low-resolution world-country polygons: the original V4 country-picking layer, public domain: https://www.naturalearthdata.com/about/terms-of-use/ . The data has simplified borders; it is not sufficient for fine geographic/legal work.
- **geoBoundaries** gbOpen PH admin data — NOT bundled by default; optional download script. geoBoundaries requires attribution and typically CC BY 4.0 / ODbL conditions; check metadata supplied with each downloaded level: https://www.geoboundaries.org/api.html .
- **Philippine administrative names** should be reconciled with the Philippine Statistics Authority's Philippine Standard Geographic Code (PSGC): https://psa.gov.ph/classification/psgc/ . In particular, administrative listings can change.
- **OpenStreetMap**: optional external location links are provided; no raster OSM map tiles or boundary database is redistributed in this ZIP. https://www.openstreetmap.org/copyright .

## Earth photo texture

- `earth_bluemarble.jpg` derives from NASA Blue Marble Next Generation imagery distributed with Basemap's `bmng.jpg` asset. NASA Earth Observatory / Visible Earth: https://visibleearth.nasa.gov/ . Credit NASA. It is NOT a live satellite image.

## Curated online Wikimedia Commons files

Files below are **linked remotely** in `place_highlights.js`; their pixels are not bundled. Authors and licenses are displayed alongside the linked image. Check current Commons file history before changing or locally redistributing; share-alike requirements apply if adaptations are created.

| Destination | Wikimedia file | Photographer | License |
| --- | --- | --- | --- |
| Philippines/Luzon | [Banaue RiceTerraces.jpg](https://commons.wikimedia.org/wiki/File:Banaue_RiceTerraces.jpg) | Jose B. Cabajar | CC BY-SA 3.0 |
| Visayas | [Chocolate Hills Bohol Philippines.jpg](https://commons.wikimedia.org/wiki/File:Chocolate_Hills_Bohol_Philippines.jpg) | Philip Nalangan | CC BY-SA 4.0 |
| Mindanao | [Mount apo.jpg](https://commons.wikimedia.org/wiki/File:Mount_apo.jpg) | Robert Anton Pimentel Aparente | CC BY-SA 4.0 |
| Central Luzon | [The Crater Lake of Mt. Pinatubo.jpg](https://commons.wikimedia.org/wiki/File:The_Crater_Lake_of_Mt._Pinatubo.jpg) | Lemuel Salibio | CC BY-SA 4.0 |
| Bataan | [Mount Samat National Shrine 2017-02-18.jpg](https://commons.wikimedia.org/wiki/File:Mount_Samat_National_Shrine_2017-02-18.jpg) | LMP 2001 | CC BY-SA 4.0 |
| Hermosa | [Saint Peter of Verona Parish Church, Hermosa, Bataan - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Saint_Peter_of_Verona_Parish_Church,_Hermosa,_Bataan_-_panoramio.jpg) | Carl Flores Trinidad | CC BY-SA 3.0 |

Creative Commons: https://creativecommons.org/licenses/by-sa/3.0/ and https://creativecommons.org/licenses/by-sa/4.0/ .

## Other artwork

Galaxy and decorative planets are CSS visual effects in the original user-approved V4 design. Icons are inline CSS/SVG/Unicode, no third-party font bundles. All story-card photos included in original V4 demo are fictional/generated sample imagery, not user-submitted real stories.

Mount Samat image (Bataan highlight):
"Shrine of Valor Mt. Samat.jpg" by Ranieljosecastaneda.
CC BY-SA 4.0.
https://commons.wikimedia.org/wiki/File:Shrine_of_Valor_Mt._Samat.jpg
https://creativecommons.org/licenses/by-sa/4.0/

## November 10, 2026 — beta discovery photo sources (local patch, not yet deployed)

`wg_discovery_data.js` lists curated, public photographic material from Wikimedia Commons. Unlike user uploads, these are licensed third-party illustrations of real places. The beta interface hotlinks images from their source and displays the photographer/source, license, and Commons file-page link. **No Wikimedia image files are bundled with the app or copied into the exported Mosaic PNG.** The exported PNG uses original vector-style decorative placeholders and place names. For all images, source links/credits must remain with the view, especially if a photo is cropped on screen. The World Before Us intentionally presents differently framed views side-by-side; no image is presented as AI-generated reconstruction or perfectly registered historical overlay.

| Used for | File / original source | Attribution | License and date |
| --- | --- | --- | --- |
| Mood · Norway | [Reine - Lofoten.jpg](https://commons.wikimedia.org/wiki/File:Reine_-_Lofoten.jpg) | Jakub Fryš | CC BY-SA 4.0, Commons upload 2019 |
| Mood · Iceland | [Iceland skogafoss waterfall.jpg](https://commons.wikimedia.org/wiki/File:Iceland_skogafoss_waterfall.jpg) | Delahanty | CC BY 4.0, 2019 |
| Mood · Kyoto | [JAP Kyoto Kiyomizu-dera.jpg](https://commons.wikimedia.org/wiki/File:JAP_Kyoto_Kiyomizu-dera.jpg) | Grueslayer | CC BY-SA 4.0 |
| Mood · Banaue | [Banaue RiceTerraces.jpg](https://commons.wikimedia.org/wiki/File:Banaue_RiceTerraces.jpg) | Jose B. Cabajar | CC BY-SA 3.0 |
| Mood · Mt. Pinatubo | [The Crater Lake of Mt. Pinatubo.jpg](https://commons.wikimedia.org/wiki/File:The_Crater_Lake_of_Mt._Pinatubo.jpg) | Lemuel Salibio | CC BY-SA 4.0 |
| THEN · Escolta | [EscoltaManila1899.jpg](https://commons.wikimedia.org/wiki/File:EscoltaManila1899.jpg) | Underwood & Underwood; scanned by Infrogmation | Public domain in US; copyright 1899 / publication 1899 |
| NOW · Escolta | [Escolta Street (Binondo, Manila; 11-10-2019).jpg](https://commons.wikimedia.org/wiki/File:Escolta_Street_(Binondo,_Manila;_11-10-2019).jpg) | Patrickroque01 | CC BY-SA 4.0; 10 November 2019 |
| THEN · Ginza | [Ginza Owaricho.jpg](https://commons.wikimedia.org/wiki/File:Ginza_Owaricho.jpg) | 大東京写真帖 (*Dai-Tokyo Shashincho*) | Public domain (Japan and US); 1930 |
| NOW · Ginza | [Ginza 4-Chome Crossing 2020-04-19.jpg](https://commons.wikimedia.org/wiki/File:Ginza_4-Chome_Crossing_2020-04-19.jpg) | Asanagi | CC0 1.0; 19 April 2020 (COVID-19 emergency period) |
| THEN · Tower Bridge | [London-TowerBridge-1900-Open.jpg](https://commons.wikimedia.org/wiki/File:London-TowerBridge-1900-Open.jpg) | Unknown photographer / Library of Congress photochrome collection | Public domain (US); approximately 1890–1905 |
| NOW · Tower Bridge | [Tower Bridge in London.jpg](https://commons.wikimedia.org/wiki/File:Tower_Bridge_in_London.jpg) | Boaventuravinicius | CC BY-SA 3.0; 4 January 2018 |

License terms: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC0](https://creativecommons.org/publicdomain/zero/1.0/). The site must respect Commons file changes/removal and should not redistribute images as unrestricted assets. The archive image is only labeled public-domain where the source's rights evidence supports that status; copyright can differ by jurisdiction. Before expanding the collection, independently verify each image date, location, viewpoint, permissions, and attribution.

### Worlds Gallery brand assets

The provided `assets/photos/worldsgallerylogo.png` (favicon and compact app logo) and `assets/photos/worldsgalleryfull.png` (header wordmark) are project-provided artwork. Asset ownership/licensing terms for redistribution outside this project are not independently verified.

## My Album static art (V2.23.6 local-only)

The default illustrated book and four scenic background crops use the **user-provided visual reference** from the November 10, 2026 project chat. `assets/photos/wg_album_reference.webp` and `wg_album_scene_*.webp` are optimized local copies and crops of that reference for the beta experience. The creator, originating source, and permission for publication have **not** been verified. **Do not publish these images on the public website until the user confirms rights/permission or replaces them with appropriately licensed original artwork.** No external scenic photographs or stock images are bundled in this update.

Custom book-cover and three introductory photos are selected from a visitor's own device, resized to WebP on-device, and stored locally in the browser only. They are not uploaded, submitted for publication, or made shareable by this feature.


- Local flag atlas `assets/photos/wg_album_flag_sheet.webp`: rasterized (rendered, not font-redistributed) Noto Color Emoji flag symbols. Source: Google Noto Emoji, https://github.com/googlefonts/noto-emoji . Emoji font under SIL OFL 1.1; flag designs drawn from public-domain / otherwise exempt region-flag sources as documented by Noto Emoji. No font files are bundled.
