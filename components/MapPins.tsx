"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import type { Event } from "@/lib/types";
import { pick, type Language } from "@/lib/i18n";

interface MapPinsProps {
  events: Event[];
  selectedEventId?: string;
  onSelect: (eventId: string) => void;
  language?: Language;
}

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm"
    }
  ]
};

export function MapPins({ events, selectedEventId, onSelect, language = "en" }: MapPinsProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const previousFocusedIdRef = useRef<string | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        maplibreRef.current = maplibre;

        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: OSM_STYLE,
          center: [53.7, 32.4],
          zoom: 4.1,
          minZoom: 3,
          maxZoom: 11
        });

        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          map.resize();
          setReady(true);
        });

        mapRef.current = map;
      } catch {
        setMapError(true);
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !maplibreRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const event of events) {
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.textContent = event.location.admin_level_2;
      markerEl.className =
        selectedEventId === event.id
          ? "map-pin map-pin-active"
          : "map-pin";
      markerEl.onclick = () => onSelect(event.id);

      const marker = new maplibreRef.current.Marker({
        element: markerEl,
        anchor: "center"
      })
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    }

    if (selectedEvent && previousFocusedIdRef.current !== selectedEvent.id) {
      previousFocusedIdRef.current = selectedEvent.id;
      mapRef.current.flyTo({
        center: [selectedEvent.location.lng, selectedEvent.location.lat],
        zoom: Math.max(mapRef.current.getZoom(), 5),
        duration: 650,
        essential: true
      });
    }
  }, [events, selectedEvent, selectedEventId, onSelect, ready]);

  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "伊朗主视图（实时底图）", "Iran Main View (Live Basemap)")}</h2>
      <p className="small-muted mb-3">
        {pick(
          language,
          "点位使用真实地图底图渲染；点击时间线或地图标记可双向联动。",
          "Points are rendered on a real basemap. Timeline items and map markers are linked both ways."
        )}
      </p>

      <div className="map-root">
        <div ref={mapContainerRef} className="map-canvas" />
        {!ready && !mapError ? (
          <div className="map-overlay">
            {pick(language, "地图加载中…", "Loading map...")}
          </div>
        ) : null}
        {mapError ? (
          <div className="map-overlay map-overlay-error">
            {pick(
              language,
              "地图加载失败，请稍后重试；当前仍可使用地点列表与时间线。",
              "Map failed to load. Please retry later; location list and timeline are still available."
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
