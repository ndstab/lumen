"use client";

import { useEffect } from "react";
import { setPageContext, resetPageContext } from "@/lib/track";

/**
 * Declares which course and lesson the current page belongs to, so that every
 * event fired from it, including ambient clicks caught by the global listener,
 * carries the right context without each component having to pass it along.
 */
export default function TrackContext({
  courseId = null,
  lessonId = null,
  label,
}: {
  courseId?: number | null;
  lessonId?: number | null;
  label: string;
}) {
  useEffect(() => {
    setPageContext({ courseId, lessonId, label });
    return () => resetPageContext();
  }, [courseId, lessonId, label]);

  return null;
}
