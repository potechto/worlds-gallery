(() => {
  "use strict";

  const portal = document.getElementById("portalDrill");
  const gate = document.getElementById("worldPortal");

  if (!portal || !gate) return;

  let activeMap = null;
  let pendingFrame = 0;

  const locations = {
    "PH|Philippines": [121.774,12.8797,4],
    "PH|Luzon": [121,16.18,5.5],
    "PH|Visayas": [123.5,11.2,6],
    "PH|Mindanao": [124.5,7.6,6],
    "PH|Central Luzon": [120.8,15.42,7],
    "PH|Bataan": [120.42,14.69,9],
    "PH|Hermosa": [120.5082,14.8297,12],
    "PH|Mariveles": [120.48,14.44,11],
    "CN|Beijing Shi": [116.4074,39.9042,10]
  };

  const norm = text => String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]/g,"");

  function countryName(code) {
    return typeof COUNTRIES !== "undefined"
      ? COUNTRIES.find(c => c[0] === code)?.[1] || code
      : code;
  }

  function selectedPlace(s) {
    return s.city || s.province || s.region ||
      s.group || s.otherRegion || countryName(s.selectedCode);
  }

  function getBoundary(s) {
    const name = selectedPlace(s);

    if (s.selectedCode === "PH") {
      const level = {
        region:"ADM1",
        province:"ADM2",
        city:"ADM3"
      }[s.stage];

      if (level) {
        const features =
          window.PH_ADMIN_GEO?.[level]?.features || [];

        const matches = features.filter(f => {
          const n = norm(f.properties?.shapeName ||
                         f.properties?.name);
          const target = norm(name);

          return n === target ||
            (target.length > 3 && n.endsWith(target));
        });

        if (matches.length === 1) {
          return matches[0].geometry;
        }
      }

      if (s.stage === "country" &&
          Array.isArray(window.PH_COASTLINE)) {
        return {
          type:"MultiPolygon",
          coordinates:window.PH_COASTLINE.map(p => [p])
        };
      }
    }

    if (s.stage === "country" &&
        typeof WORLD_GEOMETRY !== "undefined") {
      const item = WORLD_GEOMETRY.find(
        c => c.c === s.selectedCode
      );

      if (item?.p?.length) {
        return {
          type:"MultiPolygon",
          coordinates:item.p.map(p => [p])
        };
      }
    }

    return null;
  }

  function getBounds(geometry) {
    if (!geometry?.coordinates) return null;

    let west=180,east=-180,south=90,north=-90;
    let count=0;

    function scan(value) {
      if (!Array.isArray(value)) return;

      if (typeof value[0] === "number") {
        const [lon,lat] = value;

        if (Number.isFinite(lon) &&
            Number.isFinite(lat)) {
          west=Math.min(west,lon);
          east=Math.max(east,lon);
          south=Math.min(south,lat);
          north=Math.max(north,lat);
          count++;
        }
      } else {
        value.forEach(scan);
      }
    }

    scan(geometry.coordinates);

    if (!count || east-west > 180) return null;

    return [[west,south],[east,north]];
  }

  function removeMap() {
    if (activeMap) {
      activeMap.remove();
      activeMap=null;
    }
  }

  function makeLink(label,url) {
    const a=document.createElement("a");
    a.textContent=label;
    a.href=url;
    a.target="_blank";
    a.rel="noopener noreferrer";
    return a;
  }

  function createMap(container,s,note) {
    if (!window.maplibregl) {
      note.textContent="MapLibre is unavailable.";
      return;
    }

    const name=selectedPlace(s);
    const boundary=getBoundary(s);
    const bounds=getBounds(boundary);

    const meta=typeof COUNTRY_META !== "undefined"
      ? COUNTRY_META[s.selectedCode] : null;

    const country=typeof WORLD_GEOMETRY !== "undefined"
      ? WORLD_GEOMETRY.find(c=>c.c===s.selectedCode)
      : null;

    const hint=locations[s.selectedCode+"|"+name];

    const lon=hint?.[0] ?? meta?.lon ??
      country?.lon ?? 0;

    const lat=hint?.[1] ?? meta?.lat ??
      country?.lat ?? 0;

    const zoom=hint?.[2] ??
      (s.stage==="country" ? 3 : 5);

    try {
      removeMap();

      const map=new maplibregl.Map({
        container,
        style:"https://tiles.openfreemap.org/styles/liberty",
        center:[lon,lat],
        zoom,
        minZoom:1,
        maxZoom:18,
        attributionControl:true
      });

      activeMap=map;

      map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
      );

      map.on("load",()=>{
        if (activeMap !== map) return;

        if (boundary) {
          map.addSource("wg-boundary",{
            type:"geojson",
            data:{
              type:"Feature",
              properties:{name},
              geometry:boundary
            }
          });

          map.addLayer({
            id:"wg-boundary-fill",
            type:"fill",
            source:"wg-boundary",
            paint:{
              "fill-color":"#42d1c2",
              "fill-opacity":0.16
            }
          });

          map.addLayer({
            id:"wg-boundary-line",
            type:"line",
            source:"wg-boundary",
            paint:{
              "line-color":"#ffe5aa",
              "line-width":2.5
            }
          });
        }

        if (bounds) {
          map.fitBounds(bounds,{
            padding:35,
            maxZoom:12,
            duration:500
          });
        }

        note.textContent=boundary
          ? "Boundary overlay from bundled geographic data. Reference only; not a legal survey."
          : "Interactive street map. Exact local boundary data is not yet bundled for this selection.";
      });

      map.on("error",event=>{
        console.warn("Map service:",event.error);
        note.textContent=
          "Some map data could not load. External map links are available below.";
      });

      requestAnimationFrame(()=>map.resize());

    } catch(error) {
      console.error("Map initialization:",error);
      note.textContent="Unable to initialize map.";
    }
  }

  function install() {
    removeMap();

    const s=window.WorldsGalleryPortal?.getState?.();

    if (!s || s.phase!=="drill" || gate.hidden) return;

    const shell=portal.querySelector(
      ".wg-place-map-shell, .wg-other-country"
    );

    if (!shell) return;

    const name=selectedPlace(s);
    const country=countryName(s.selectedCode);

    const outline=shell.querySelector(".wg-geo-map");
    const oldLink=shell.querySelector(".wg-explore-map");

    if (oldLink) oldLink.style.display="none";

    if (!outline) {
      shell.replaceChildren();
      shell.classList.add("wg-live-global-panel");
    }

    const toolbar=document.createElement("div");
    toolbar.className="wg-map-toolbar";

    const street=document.createElement("button");
    street.type="button";
    street.textContent="Street map";

    toolbar.appendChild(street);

    let outlineButton=null;

    if (outline) {
      outlineButton=document.createElement("button");
      outlineButton.type="button";
      outlineButton.textContent="Geographic outline";
      toolbar.prepend(outlineButton);
    }

    const mapContainer=document.createElement("div");
    mapContainer.className="wg-live-street-map";

    const actions=document.createElement("div");
    actions.className="wg-map-actions";

    const query=[name,country].filter(
      (x,i,a)=>a.indexOf(x)===i
    ).join(", ");

    actions.append(
      makeLink(
        "Open in Google Maps",
        "https://www.google.com/maps/search/?api=1&query="+
        encodeURIComponent(query)
      )
    );

    const note=document.createElement("p");
    note.className="wg-map-status";
    note.textContent="Select Street map to explore.";

    shell.prepend(toolbar);
    shell.append(mapContainer,actions,note);

    function show(mode) {
      const useStreet=mode==="street";

      if (outline) {
        outline.style.display=useStreet ? "none" : "";
      }

      mapContainer.style.display=
        useStreet ? "block" : "none";

      street.classList.toggle("selected",useStreet);
      street.setAttribute("aria-pressed",String(useStreet));

      if (outlineButton) {
        outlineButton.classList.toggle(
          "selected",!useStreet
        );
        outlineButton.setAttribute(
          "aria-pressed",String(!useStreet)
        );
      }

      if (useStreet) {
        if (!activeMap) {
          createMap(mapContainer,s,note);
        } else {
          requestAnimationFrame(()=>activeMap?.resize());
        }
      } else {
        removeMap();
        note.textContent=
          "Geographic outline based on bundled map data.";
      }
    }

    street.addEventListener("click",()=>show("street"));

    if (outlineButton) {
      outlineButton.addEventListener(
        "click",()=>show("outline")
      );
    }

    show(outline ? "outline" : "street");
  }

  function scheduleInstall() {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);

    pendingFrame=requestAnimationFrame(()=>{
      pendingFrame=0;
      install();
    });
  }

  // Observe only direct drill replacements.
  // Map-internal DOM changes will NOT cause a render loop.
  new MutationObserver(scheduleInstall).observe(
    portal,{childList:true,subtree:false}
  );

  new MutationObserver(()=>{
    if (gate.hidden) removeMap();
  }).observe(gate,{
    attributes:true,
    attributeFilter:["hidden"]
  });

  if (portal.children.length) scheduleInstall();

})();
