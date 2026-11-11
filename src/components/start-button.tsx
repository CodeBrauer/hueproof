"use client";

import { Button } from "@/components/ui/button";

/** Leads from the description at the end of the page back up to the palette. */
export function StartButton({ children }: { children: React.ReactNode }) {
  function scrollToPalette() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }
  return <Button onClick={scrollToPalette}>{children}</Button>;
}
