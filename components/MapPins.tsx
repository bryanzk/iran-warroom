"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import type { Event, SeedData } from "@/lib/types";
import { pick, type Language } from "@/lib/i18n";

interface MapPinsProps {
  events: Event[];
  regionalImpacts: SeedData["regional_impacts"];
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

type MapViewMode = "iran" | "regional";

type RenderPoint = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  note: string;
  selectableEventId?: string;
  highlighted: boolean;
};

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  Jordan: { lat: 31.95, lng: 35.93 },
  Iraq: { lat: 33.31, lng: 44.36 },
  Israel: { lat: 31.77, lng: 35.21 },
  "U.A.E.": { lat: 25.2, lng: 55.27 },
  UAE: { lat: 25.2, lng: 55.27 },
  Qatar: { lat: 25.29, lng: 51.53 },
  Kuwait: { lat: 29.37, lng: 47.98 },
  "Saudi Arabia": { lat: 24.71, lng: 46.67 }
};

function buildIranPoints(
  events: Event[],
  selectedEventId: string | undefined,
  language: Language
): RenderPoint[] {
  const grouped = new Map<
    string,
    {
      city: string;
      lat: number;
      lng: number;
      events: Event[];
    }
  >();

  for (const event of events) {
    const key = `${event.location.admin_level_1}-${event.location.admin_level_2}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.events.push(event);
      continue;
    }

    grouped.set(key, {
      city: event.location.admin_level_2,
      lat: event.location.lat,
      lng: event.location.lng,
      events: [event]
    });
  }

  return Array.from(grouped.values())
    .map((entry) => {
      const sorted = [...entry.events].sort((a, b) => b.confidence - a.confidence);
      const anchor = sorted[0];
      const hasSelected = entry.events.some((event) => event.id === selectedEventId);

      return {
        id: `iran-${entry.city}`,
        lng: entry.lng,
        lat: entry.lat,
        label: entry.city,
        note:
          entry.events.length > 1
            ? pick(language, `${entry.events.length}个事件点`, `${entry.events.length} mapped events`)
            : pick(language, "单一事件点", "Single mapped event"),
        selectableEventId: hasSelected ? selectedEventId : anchor.id,
        highlighted: hasSelected
      };
    })
    .sort((a, b) => Number(b.highlighted) - Number(a.highlighted));
}

function buildRegionalPoints(
  impacts: SeedData["regional_impacts"],
  language: Language
): RenderPoint[] {
  return impacts
    .map((impact, index) => {
      const coord = COUNTRY_COORDS[impact.country];
      if (!coord) {
        return null;
      }

      return {
        id: `regional-${impact.country}-${index}`,
        lng: coord.lng,
        lat: coord.lat,
        label: impact.country,
        note: pick(language, "区域外溢影响", "Regional spillover"),
        highlighted: false
      } as RenderPoint;
    })
    .filter((item): item is RenderPoint => item !== null);
}

export function MapPins({
  events,
  regionalImpacts,
  selectedEventId,
  onSelect,
  language = "en"
}: MapPinsProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const previousFocusedIdRef = useRef<string | undefined>(undefined);

  const [viewMode, setViewMode] = useState<MapViewMode>("iran");
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const iranPoints = useMemo(
    () => buildIranPoints(events, selectedEventId, language),
    [events, selectedEventId, language]
  );

  const regionalPoints = useMemo(
    () => buildRegionalPoints(regionalImpacts, language),
    [regionalImpacts, language]
  );

  const activePoints = viewMode === "iran" ? iranPoints : regionalPoints;

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
          zoom: 4.35,
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

    for (const point of activePoints) {
      const markerRoot = document.createElement("div");
      markerRoot.className = point.highlighted ? "map-marker map-marker-active" : "map-marker";

      const dotButton = document.createElement("button");
      dotButton.type = "button";
      dotButton.className = "map-dot";
      dotButton.setAttribute("aria-label", `${point.label} - ${point.note}`);
      if (point.selectableEventId) {
        dotButton.onclick = () => onSelect(point.selectableEventId as string);
      }

      const label = document.createElement("span");
      label.className = "map-label";
      label.textContent = point.label;

      const note = document.createElement("span");
      note.className = "map-note";
      note.textContent = point.note;

      markerRoot.appendChild(dotButton);
      markerRoot.appendChild(label);
      markerRoot.appendChild(note);

      const marker = new maplibreRef.current.Marker({
        element: markerRoot,
        anchor: "bottom-left"
      })
        .setLngLat([point.lng, point.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    }

    if (viewMode === "iran" && selectedEvent && previousFocusedIdRef.current !== selectedEvent.id) {
      previousFocusedIdRef.current = selectedEvent.id;
      mapRef.current.flyTo({
        center: [selectedEvent.location.lng, selectedEvent.location.lat],
        zoom: Math.max(mapRef.current.getZoom(), 5.15),
        duration: 650,
        essential: true
      });
      return;
    }

    if (viewMode === "regional") {
      mapRef.current.flyTo({
        center: [44.5, 27.2],
        zoom: 3.9,
        duration: 650,
        essential: true
      });
      return;
    }

    if (viewMode === "iran" && !selectedEvent) {
      mapRef.current.flyTo({
        center: [53.7, 32.4],
        zoom: 4.35,
        duration: 450,
        essential: true
      });
    }
  }, [activePoints, selectedEvent, onSelect, ready, viewMode]);

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold md:text-lg">
            {pick(language, "打击与外溢位置图", "Strike and Spillover Map")}
          </h2>
          <p className="small-muted">
            {pick(
              language,
              "红色方点为映射事件位置；支持伊朗主视图与区域外溢视图。",
              "Red square markers represent mapped locations, with Iran and regional spillover views."
            )}
          </p>
        </div>
        <div className="map-toggle">
          <button
            type="button"
            className={viewMode === "iran" ? "map-toggle-btn map-toggle-btn-active" : "map-toggle-btn"}
            onClick={() => setViewMode("iran")}
          >
            {pick(language, "伊朗境内", "Inside Iran")}
          </button>
          <button
            type="button"
            className={viewMode === "regional" ? "map-toggle-btn map-toggle-btn-active" : "map-toggle-btn"}
            onClick={() => setViewMode("regional")}
          >
            {pick(language, "区域外溢", "Regional")}
          </button>
        </div>
      </div>

      <div className="map-root">
        <div ref={mapContainerRef} className="map-canvas" />
        <div className="map-legend" aria-hidden>
          <span className="map-legend-dot" />
          <span>{pick(language, "事件点", "Mapped point")}</span>
          <span className="font-mono">{activePoints.length}</span>
        </div>
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
