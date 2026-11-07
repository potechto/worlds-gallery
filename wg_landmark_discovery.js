(() => {
  "use strict";

  const portal = document.getElementById("portalDrill");
  if (!portal) return;

  let controller = null;
  let timer = null;

  const countryName = code =>
    (typeof COUNTRIES !== "undefined"
      ? COUNTRIES.find(c => c[0] === code)?.[1]
      : null) || code;

  const normal = s => String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const fileKey = s => String(s || "")
    .replace(/^File:/i, "")
    .replace(/_/g, " ")
    .toLowerCase();

  const clean = s => new DOMParser()
    .parseFromString(String(s || ""), "text/html")
    .body.textContent.replace(/\s+/g, " ").trim();

  const text = (tag, value, cls) => {
    const el = document.createElement(tag);
    el.textContent = value;
    if (cls) el.className = cls;
    return el;
  };

  const link = (label, url) => {
    const a = text("a", label);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  };

  function placeInfo(s) {
    const country = countryName(s.selectedCode);
    const original = s.city || s.province || s.region ||
      s.group || s.otherRegion || country;

    const place = original.replace(/\s+(Shi|Sheng|To)$/i, "");

    return {
      place, country, stage: s.stage, code: s.selectedCode,
      parent: s.city ? s.province : ""
    };
  }

  async function api(host, params, signal) {
    const url = new URL("https://" + host + "/w/api.php");

    const options = {
      action: "query",
      format: "json",
      origin: "*",
      ...params
    };

    for (const [key, value] of Object.entries(options)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, { signal });

    if (response.status === 429) {
      throw new Error("Wikimedia is rate-limiting requests");
    }

    if (!response.ok) {
      throw new Error("Source unavailable: HTTP " + response.status);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.info || "Source API error");
    }

    return data;
  }

  function allowed(info) {
    if (!info?.thumburl) return false;

    const license = clean(
      info.extmetadata?.LicenseShortName?.value
    );

    const mime = info.mime || "";

    return /^image\/(jpeg|png|webp)$/i.test(mime) &&
      /^(CC BY(?:-SA)?(?:\s|$)|CC0|Public domain|PD(?:-|$))/i
        .test(license);
  }

  function photoRecord(info, page, summary, article) {
    if (!allowed(info)) return null;

    const fileRef = String(
      info.descriptionurl || info.thumburl || ""
    );

    let fileName = fileRef;

    try {
      fileName = decodeURIComponent(fileRef);
    } catch {}

    fileName = fileName.replace(/[_%-]/g, " ");

    if (/\b(?:map|maps|locator|diagram|outline|flag|seal|ph\s+fil|coat\s+of\s+arms)\b/i.test(fileName)) {
      return null;
    }

    const meta = info.extmetadata || {};

    return {
      title: page,
      summary: summary || "Explore the photograph and its source.",
      image: info.thumburl,
      file: info.descriptionurl || "",
      article: article || info.descriptionurl || "",
      artist: clean(meta.Artist?.value) ||
        "See Wikimedia Commons for creator details",
      license: clean(meta.LicenseShortName?.value),
      licenseUrl: meta.LicenseUrl?.value ||
        info.descriptionurl || ""
    };
  }

  async function wikipediaLandmarks(location, signal) {
    const query = [
      location.place, location.parent, location.country,
      "landmarks tourist attractions"
    ].filter(Boolean).join(" ");

    const data = await api("en.wikipedia.org", {
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "0",
      gsrlimit: "24",
      prop: "pageimages|extracts",
      piprop: "thumbnail|name",
      pithumbsize: "960",
      exintro: "1",
      explaintext: "1",
      exsentences: "2"
    }, signal);

    const pages = Object.values(data.query?.pages || {})
      .sort((a, b) => (a.index || 0) - (b.index || 0));

    const place = normal(location.place);
    const country = normal(location.country);

    const landmarkWords =
      /\b(shrine|monument|museum|church|temple|palace|castle|fort|park|garden|beach|lake|mountain|hill|waterfall|falls|bridge|tower|cathedral|mosque|heritage|landmark|historical|historic|memorial|cave|island|reserve|sanctuary|wall|basilica)\b/i;

    const candidates = pages.filter(p => {
      if (!p.pageimage || !p.extract) return false;

      if (/^(list of|tourism in|history of|geography of)/i
          .test(p.title)) return false;

      const body = p.title + " " + p.extract;
      const matchesPlace = normal(body).includes(place);
      const matchesCountry = normal(body).includes(country);

      const matchesParent = location.parent &&
        normal(body).includes(normal(location.parent));

      const associated = location.stage === "country"
        ? matchesCountry
        : matchesPlace && (matchesCountry || matchesParent);

      return associated && landmarkWords.test(body);
    }).slice(0, 7);

    if (!candidates.length) return [];

    const titles = candidates.map(
      p => "File:" + p.pageimage.replace(/^File:/i, "")
    );

    const commons = await api("commons.wikimedia.org", {
      titles: titles.join("|"),
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata",
      iiurlwidth: "960",
      iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl"
    }, signal);

    const images = new Map(
      Object.values(commons.query?.pages || {})
        .map(p => [fileKey(p.title), p.imageinfo?.[0]])
    );

    const records = [];

    for (const page of candidates) {
      const info = images.get(fileKey(page.pageimage));

      const source = "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(page.title.replaceAll(" ", "_"));

      const record = photoRecord(
        info,
        page.title,
        page.extract.slice(0, 270),
        source
      );

      if (record) records.push(record);
    }

    return records.slice(0, 3);
  }

  async function commonsPhotographs(location, signal) {
    const data = await api("commons.wikimedia.org", {
      generator: "search",
      gsrsearch: [
        location.place, location.parent, location.country
      ].filter(Boolean).join(" "),
      gsrnamespace: "6",
      gsrlimit: "12",
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata",
      iiurlwidth: "960",
      iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl"
    }, signal);

    const records = [];

    for (const page of Object.values(data.query?.pages || {})) {
      const title = page.title
        .replace(/^File:/i, "")
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/_/g, " ");

      const match = normal(title).includes(
        normal(location.place)
      );

      if (!match) continue;

      const record = photoRecord(
        page.imageinfo?.[0],
        title,
        "Photograph associated with this destination. " +
          "Open its source page to verify the depicted location.",
        page.imageinfo?.[0]?.descriptionurl
      );

      if (record) records.push(record);
      if (records.length >= 3) break;
    }

    return records;
  }

  async function discover(location, signal) {
    const key = "WG_DISCOVER_V4|" +
      [location.code, location.stage, location.place,
        location.parent || ""].join("|");

    try {
      const saved = JSON.parse(sessionStorage.getItem(key));

      if (saved && Date.now() - saved.time < 21600000) {
        return saved.items;
      }
    } catch {}

    let items = await wikipediaLandmarks(location, signal);

    if (!items.length) {
      items = await commonsPhotographs(location, signal);
    }

    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ time: Date.now(), items })
      );
    } catch {}

    return items;
  }


  function displayCards(box, items, location) {
    box.replaceChildren();

    box.append(
      text("span", "FEATURED PLACE - " + location.place,
        "wg-discover-kicker")
    );

    const item = items.find(x => x && x.title && x.image);

    if (!item) {
      box.append(
        text("h3", "Local highlight not yet sourced"),
        text("p",
          "No suitably licensed photograph was confidently " +
          "matched. We will not display unrelated images.",
          "wg-discover-note")
      );
      return;
    }

    const card = document.createElement("article");
    card.className = "wg-discover-card";

    const picture = document.createElement("div");
    picture.className = "wg-discover-image";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.loading = "lazy";

    img.onerror = () => {
      picture.replaceChildren(
        text("span", "Photo temporarily unavailable")
      );
    };

    picture.append(img);

    const body = document.createElement("div");
    body.className = "wg-discover-body";

    body.append(
      text("h3", item.title),
      text("p", String(item.summary || "")
        .replace(/\s+/g, " ").slice(0, 190)),
      text("small", "Photo match pending review.",
        "wg-discover-note"),
      text("div",
        "Photo: " + item.artist + " - " + item.license,
        "wg-discover-credit")
    );

    if (item.file?.startsWith("https://")) {
      body.append(link("Photo source", item.file));
    }

    if (item.licenseUrl?.startsWith("https://")) {
      body.append(text("span", " | "));
      body.append(link("License", item.licenseUrl));
    }

    if (item.article?.startsWith("https://")) {
      body.append(text("span", " | "));
      body.append(link("Learn more", item.article));
    }

    card.append(picture, body);
    box.append(card);
  }

  function install(override = null) {
    controller?.abort();

    const state = window.WorldsGalleryPortal?.getState?.();

    if (!state || state.phase !== "drill") return;

    const shell = portal.querySelector(".detail-shell");
    if (!shell) return;

    const location = override || placeInfo(state);
    shell.querySelector(".wg-discover")?.remove();

    const box = document.createElement("section");

    box.className = "wg-discover";
    box.setAttribute(
      "aria-label",
      "Photos and places from " + location.place
    );

    box.append(
      text("h3", "Featured place"),
      text("p", "Finding a source-linked destination photo...")
    );

    const placePanel = shell.querySelector(".wg-place-panel");
    const curated = shell.querySelector(".wg-highlight");
    const emptyFeature = shell.querySelector(".wg-edu-fallback");
    const generic = shell.querySelector(".wg-other-country");

    // Preserve the approved curated highlight.
    if (curated && location.stage !== "local-lookup") return;

    if (curated) curated.replaceWith(box);
    else if (emptyFeature) emptyFeature.replaceWith(box);
    else if (generic) generic.replaceWith(box);
    else if (placePanel) placePanel.append(box);
    else shell.append(box);

    const request = new AbortController();
    controller = request;

    discover(location, request.signal)
      .then(items => {
        if (request.signal.aborted || !box.isConnected) return;
        displayCards(box, items, location);
      })
      .catch(error => {
        if (request.signal.aborted || !box.isConnected) return;

        box.replaceChildren(
          text("h3", "Place discovery unavailable"),
          text("p",
            error.message +
            ". Existing maps and curated highlights still work.")
        );
      });
  }

  window.addEventListener("wg:place-lookup", event => {
    const state = window.WorldsGalleryPortal?.getState?.();
    if (!state || state.phase !== "drill") return;

    const selected = placeInfo(state);
    const info = event.detail || {};

    if (info.country !== selected.country) return;

    const place = String(info.place || "")
      .trim().slice(0, 120);

    if (!place) return;

    install({
      ...selected,
      place,
      parent: String(info.parent || "")
        .trim().slice(0, 120),
      stage: "local-lookup"
    });
  });

  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 650);
  }).observe(portal, {
    childList: true,
    subtree: false
  });

  if (portal.children.length) install();
})();
