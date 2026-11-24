function storageKey(kind) {
  // Each page folder gets its own key, so two projects on one github.io site do not share memory.
  return "geog464-" + kind + ":" + location.pathname.replace(/[^/]*$/, "");
}

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; }
  catch (e) { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }   // some private windows block storage
}

// Save current zoom level 
export function rememberView(map) {
    const key = storageKey("view");
    const home = { 
        center: map.getCenter(), 
        zoom: map.getZoom() };   // the view your code set
    const saved = load(key, null);
    if (saved && typeof saved.lat === "number" && typeof saved.lng === "number" && typeof saved.zoom === "number") {
        map.flyTo({
            center: [saved.lng, saved.lat],
            zoom: saved.zoom
        });             // reopen where the reader left it
    }
    map.on("moveend", () => {
        const c = map.getCenter();
        save(key, { lat: Math.round(c.lat * 1e5) / 1e5, lng: Math.round(c.lng * 1e5) / 1e5, zoom: map.getZoom() });
    });
    class Reset {
        onAdd(map) {
            this.map = map;

            const container = document.createElement("div");
            container.className = "maplibregl-ctrl";

            const b = document.createElement("button");

            b.className = "geog464-reset";
            b.type = "button";
            b.textContent = "Reset view";

            b.style.cssText = `
                background: #fff;
                border: 2px solid rgba(0,0,0,.25);
                border-radius: 6px;
                padding: 6px 10px;
                font: 14px Arial, sans-serif;
                cursor: pointer;
            `;

            b.onclick = function(e) {

                e.preventDefault();
                e.stopPropagation();

                map.jumpTo({
                    center: [home.center.lng, home.center.lat],
                    zoom: home.zoom
                });
            };
            container.appendChild(b);
            this.container = b;
            return container;
        }

        onRemove() {
            this.container.remove();
            this.map = undefined;
        }
    }
    map.addControl(new Reset(), "bottom-left");
}