"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, flush, flushBeacon, describeElement, getPageContext } from "@/lib/track";

/**
 * Mounted once in the root layout. Captures the ambient activity that no
 * individual component is responsible for: page views, every click anywhere on
 * the document, scroll depth, and tab visibility.
 *
 * The brief names clicks explicitly, so the click listener is deliberately
 * global rather than a set of handlers on the elements we remembered to
 * instrument.
 */
export default function Tracker({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const depthSeen = useRef<Set<number>>(new Set());

  /* ------------------------------------------------------------ page views */
  useEffect(() => {
    depthSeen.current = new Set();

    track({
      component: "Navigation",
      eventName: "Page viewed",
      action: "viewed",
      target: "page",
      meta: {
        title: document.title,
        signedIn,
        referrer: document.referrer || null,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
    // Send the page view promptly rather than waiting for the batch window, so
    // the educator stream feels live during a demo.
    void flush();
  }, [pathname, signedIn]);

  /* ---------------------------------------------------------------- clicks */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const { target, label, href } = describeElement(e.target);
      const ctx = getPageContext();

      if (href && !href.startsWith("#")) {
        track({
          component: "Navigation",
          eventName: "Link followed",
          action: "followed",
          target: "link",
          meta: { to: href, label, element: target, context: ctx.label },
        });
        return;
      }

      track({
        component: "Navigation",
        eventName: "Element clicked",
        action: "clicked",
        target: "element",
        meta: {
          element: target,
          label,
          x: e.clientX,
          y: e.clientY,
        },
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  /* ---------------------------------------------------------- scroll depth */
  useEffect(() => {
    let ticking = false;

    function measure() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 40) return;

      const pct = Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100);
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !depthSeen.current.has(mark)) {
          depthSeen.current.add(mark);
          track({
            component: "Navigation",
            eventName: "Page scrolled",
            action: "scrolled",
            target: "page",
            meta: { depthPercent: mark },
          });
        }
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  /* ----------------------------------------------------- visibility, unload */
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        track({
          component: "Navigation",
          eventName: "Page hidden",
          action: "left",
          target: "page",
        });
        flushBeacon();
      } else {
        track({
          component: "Navigation",
          eventName: "Page shown",
          action: "returned to",
          target: "page",
        });
      }
    }

    function onPageHide() {
      flushBeacon();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      flushBeacon();
    };
  }, []);

  return null;
}
