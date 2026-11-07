/* Worlds Gallery: source-linked world knowledge. */
(() => {
  "use strict";

  const portal = document.getElementById("portalDrill");
  if (!portal) return;

  const memo = new Map();
  let pending = null;

  const aliases = {
    "PH|country|Philippines": "Philippines",
    "PH|group|Luzon": "Luzon",
    "PH|group|Visayas": "Visayas",
    "PH|group|Mindanao": "Mindanao",
    "PH|region|Central Luzon": "Central Luzon",
    "PH|province|Bataan": "Bataan",
    "PH|city|Hermosa": "Hermosa, Bataan",
    "PH|city|Mariveles": "Mariveles, Bataan",
    "CN|other-region|Beijing Shi": "Beijing"
  };

  const normalize = s => String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const countryFor = s =>
    (typeof COUNTRIES !== "undefined"
      ? COUNTRIES.find(c => c[0] === s.selectedCode)?.[1]
      : null) || s.selectedCode;

  const placeFor = s =>
    s.city || s.province || s.region ||
    s.group || s.otherRegion || countryFor(s);

  function line(tag, classname, content) {
    const el = document.createElement(tag);
    if (classname) el.className = classname;
    if (content !== undefined) el.textContent = content;
    return el;
  }

  function href(label, url, classname = "") {
    const a = line("a", classname, label);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  const wikiSearch = query =>
    "https://en.wikipedia.org/w/index.php?search=" +
    encodeURIComponent(query);

  async function getJSON(url, signal) {
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" }
    });

    if (response.status === 429) {
      throw new Error("Knowledge service is temporarily rate-limited");
    }

    if (!response.ok) {
      throw new Error("Knowledge service returned HTTP " + response.status);
    }

    return response.json();
  }

  async function getSummary(title, signal) {
    const path = encodeURIComponent(title.replaceAll(" ", "_"));
    const url =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + path;

    try {
      const result = await getJSON(url, signal);

      return result.type === "disambiguation" || !result.extract
        ? null
        : result;
    }
    catch (error) {
      if (error.name === "AbortError") throw error;
      return null;
    }
  }

  async function findPage(name, country, stage, preferred, signal) {
    if (preferred) {
      const summary = await getSummary(preferred, signal);
      if (summary) return summary;
    }

    if (stage === "country") {
      const direct = await getSummary(name, signal);
      if (direct) return direct;
    }

    const query = [name, country]
      .filter((v, i, arr) => v && arr.indexOf(v) === i)
      .join(" ");

    const searchURL =
      "https://en.wikipedia.org/w/rest.php/v1/search/page?q=" +
      encodeURIComponent(query) + "&limit=8";

    const data = await getJSON(searchURL, signal);

    const wanted = normalize(name).replace(/ (shi|sheng|to)$/, "");
    const countryText = normalize(country);

    const candidates = (data.pages || [])
      .map(page => {
        const title = normalize(page.title)
          .replace(/ (shi|sheng|to)$/, "");

        const description = normalize(page.description || "");
        const combined = normalize(
          page.title + " " + (page.description || "")
        );

        const matchesName =
          title === wanted ||
          title.startsWith(wanted + " ") ||
          title.includes(" " + wanted + " ");

        const matchesCountry =
          stage === "country" ||
          combined.includes(countryText);

        const score =
          (title === wanted ? 20 : matchesName ? 12 : 0) +
          (matchesCountry ? 12 : 0);

        return { page, score, matchesName, matchesCountry };
      })
      .filter(x =>
        x.matchesName && x.matchesCountry && x.score >= 24
      )
      .sort((a, b) => b.score - a.score);

    for (const candidate of candidates.slice(0, 2)) {
      const summary = await getSummary(candidate.page.title, signal);
      if (summary) return summary;
    }

    return null;
  }

  function sectionURL(page, prop, section) {
    const url = new URL("https://en.wikipedia.org/w/api.php");

    const params = {
      action: "parse",
      page,
      prop,
      format: "json",
      origin: "*"
    };

    if (section !== undefined) {
      params.section = String(section);
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url;
  }

  function readParagraphs(markup) {
    const doc = new DOMParser().parseFromString(
      markup || "", "text/html"
    );

    doc.querySelectorAll(
      "sup, .mw-editsection, style, script, .reference, .hatnote"
    ).forEach(node => node.remove());

    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map(p => (p.textContent || "")
        .replace(/\[[0-9,\s]+\]/g, "")
        .replace(/\s+/g, " ")
        .trim()
      )
      .filter(p => p.length > 40);

    const text = paragraphs.slice(0, 2).join(" ");

    return text.length > 650
      ? text.slice(0, 647).replace(/\s+\S*$/, "") + "..."
      : text;
  }

  async function getSection(page, regex, signal) {
    const list = await getJSON(
      sectionURL(page, "sections"), signal
    );

    const sections = list.parse?.sections || [];

    const found = sections.find(section =>
      regex.test(
        String(section.line || "").replace(/<[^>]+>/g, "")
      )
    );

    if (!found) return "";

    const data = await getJSON(
      sectionURL(page, "text", found.index), signal
    );

    return readParagraphs(data.parse?.text?.["*"]);
  }

  async function facts(name, country, stage, preferred, signal) {
    const key = [stage, name, country, preferred].join("|");

    if (memo.has(key)) return memo.get(key);

    const summary = await findPage(
      name, country, stage, preferred, signal
    );

    if (!summary) return null;

    const result = {
      summary,
      history: "",
      origin: "",
      culture: ""
    };

    try {
      result.history = await getSection(
        summary.title,
        /^(history(?: of .*)?|historical (?:background|overview|development)|early history)$/i,
        signal
      );
    }
    catch (error) {
      if (error.name === "AbortError") throw error;
    }

    try {
      result.origin = await getSection(
        summary.title,
        /^(etymology(?: and .*)?|name(?: and .*)?|naming|origin of (the )?name|toponymy)$/i,
        signal
      );
    }
    catch (error) {
      if (error.name === "AbortError") throw error;
    }

    try {
      result.culture = await getSection(
        summary.title,
        /^(culture|culture and heritage|cultural heritage|arts and culture|heritage|tourism|tourist attractions)$/i,
        signal
      );
    } catch (error) {
      if (error.name === "AbortError") throw error;
    }

    memo.set(key, result);
    return result;
  }

  function paint(box, data, name, country) {
    box.replaceChildren();

    box.append(
      line("div", "wg-knowledge-label", "WORLD KNOWLEDGE · SOURCED"),
      line("h3", "wg-knowledge-title", "Discover " + name)
    );

    const query = [name, country]
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .join(", ");

    if (!data) {
      box.append(
        line("p", "wg-knowledge-fallback",
          "No reliably matched encyclopedia article was found. " +
          "We will not substitute an unrelated place with the same name."
        ),
        href(
          "Search Wikipedia for this place",
          wikiSearch(query),
          "wg-knowledge-link"
        )
      );
      return;
    }

    box.append(
      line("p", "wg-knowledge-text", data.summary.extract)
    );

    const fields = [
      [
        "Name & origin",
        data.origin,
        "No separate verified etymology section was found."
      ],
      [
        "History",
        data.history,
        "No separate verified history section was found."
      ],
      [
        "Culture & heritage",
        data.culture,
        "No separate verified culture section was found."
      ]
    ];

    const grid = line("div", "wg-knowledge-grid");

    for (const [title, value, fallback] of fields) {
      const item = line("section", "wg-knowledge-subsection");

      item.append(
        line("h4", "", title),
        line("p", "", value || fallback)
      );

      grid.appendChild(item);
    }

    box.appendChild(grid);

    const source = data.summary.content_urls?.desktop?.page ||
      wikiSearch(data.summary.title);

    const credits = line("div", "wg-knowledge-credits");

    credits.append(
      href("Read full sourced article", source, "wg-knowledge-link"),
      line("span", "", "Text: Wikipedia contributors"),
      href(
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/"
      )
    );

    box.appendChild(credits);
  }

  function addLocalLookup(box, country) {
    const form = line("form", "wg-local-lookup");

    const label = line(
      "label",
      "wg-local-label",
      "Look up another city or municipality in " + country
    );

    const row = line("div", "wg-local-row");
    const input = document.createElement("input");

    input.type = "search";
    input.placeholder = "Example: Hermosa, Bataan or Kyoto";
    input.autocomplete = "off";
    input.minLength = 2;
    input.maxLength = 100;
    input.required = true;

    label.appendChild(input);

    const button = line("button", "", "Find local history");
    button.type = "submit";

    row.append(label, button);

    const result = line("div", "wg-local-result");

    form.append(row, result);
    box.appendChild(form);

    let searchController = null;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!input.reportValidity()) return;

      searchController?.abort();
      searchController = new AbortController();

      const term = input.value.trim();
      const parts = term.split(",")
        .map(s => s.trim()).filter(Boolean);

      window.dispatchEvent(new CustomEvent("wg:place-lookup", {
        detail: {
          place: parts[0] || "",
          parent: parts.slice(1).join(", "),
          country
        }
      }));

      result.replaceChildren(
        line("p", "", "Searching references for " + term + "...")
      );

      try {
        const data = await facts(
          term, country, "local-lookup", "",
          searchController.signal
        );

        if (!result.isConnected || searchController.signal.aborted) {
          return;
        }

        const display = line("div", "wg-local-result-content");

        paint(display, data, term, country);

        display.appendChild(
          href(
            "Locate in Google Maps",
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(term + ", " + country),
            "wg-knowledge-link"
          )
        );

        result.replaceChildren(display);
      }
      catch (error) {
        if (searchController.signal.aborted) return;

        result.replaceChildren(
          line("p", "", error.message)
        );
      }
    });
  }

  function showKnowledge() {
    const state = window.WorldsGalleryPortal?.getState?.();
    const shell = portal.querySelector(".detail-shell");

    if (!state || state.phase !== "drill" || !shell) return;

    if (shell.querySelector(".wg-world-knowledge")) return;

    if (pending) {
      pending.abort();
      pending = null;
    }

    const name = placeFor(state);
    const country = countryFor(state);

    const box = line("section", "wg-world-knowledge");

    box.setAttribute(
      "aria-label",
      "Educational information about " + name
    );

    box.append(
      line("div", "wg-knowledge-label", "WORLD KNOWLEDGE"),
      line("p", "wg-knowledge-loading",
        "Loading source-linked information..."
      )
    );

    shell.appendChild(box);

    if (state.selectedCode === "PH" &&
        state.province === "Bataan" && !state.city) {
      portal.querySelector(".wg-highlight")
        ?.classList.add("wg-photo-full");
    }

    const controller = new AbortController();
    pending = controller;

    const preferred = aliases[
      [state.selectedCode, state.stage, name].join("|")
    ] || "";

    facts(
      name, country, state.stage, preferred, controller.signal
    ).then(data => {
      if (!box.isConnected || controller.signal.aborted) return;

      paint(box, data, name, country);
      addLocalLookup(box, country);
    }).catch(error => {
      if (controller.signal.aborted || !box.isConnected) return;

      box.replaceChildren(
        line("h3", "", "Knowledge temporarily unavailable"),
        line("p", "",
          error.message + ". This does not affect the street map."
        ),
        href(
          "Browse source",
          wikiSearch(name + " " + country),
          "wg-knowledge-link"
        )
      );

      addLocalLookup(box, country);
    });
  }

  let timer = null;

  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(showKnowledge, 350);
  }).observe(portal, {
    childList: true,
    subtree: false
  });

  if (portal.children.length) showKnowledge();
})();
