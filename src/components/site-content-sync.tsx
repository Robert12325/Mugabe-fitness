"use client";

import { useEffect } from "react";
import { replaceSiteContent } from "@/lib/store";
import { fetchSiteContent } from "@/lib/site-content-client";

/**
 * Pulls the published programs and method steps into this browser so every
 * visitor sees what the coach set, not the built-in defaults.
 *
 * Renders nothing. Until the request lands — or if the database is not
 * reachable — the built-in content stays on screen.
 */
export default function SiteContentSync() {
  useEffect(() => {
    let active = true;

    fetchSiteContent().then((result) => {
      if (!active) return;

      if (result.state === "online" && result.initialized) {
        replaceSiteContent(
          result.programs,
          result.method,
          result.settings,
          result.photos,
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
