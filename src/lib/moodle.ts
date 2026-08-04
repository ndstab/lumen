/**
 * Projection of our `events` rows onto the seven columns used by a Moodle
 * standard log report, which is the reference format for this project:
 *
 *   Time | Event context | Component | Event name | Description | Origin | IP address
 *
 * Keeping this in one place means the on-screen event stream and the CSV
 * export can never drift apart.
 */

export const MOODLE_COLUMNS = [
  "Time",
  "Event context",
  "Component",
  "Event name",
  "Description",
  "Origin",
  "IP address",
] as const;

export interface EventRow {
  id: number;
  occurred_at: string;
  context: string;
  component: string;
  event_name: string;
  description: string;
  origin: string;
  ip: string | null;
}

/** Moodle renders timestamps as "4/08/24, 23:51:58". Match it exactly. */
export function moodleTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  const day = d.getDate();
  const month = p(d.getMonth() + 1);
  const year = p(d.getFullYear() % 100);
  return `${day}/${month}/${year}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function toMoodleRow(e: EventRow): string[] {
  return [
    moodleTime(e.occurred_at),
    e.context,
    e.component,
    e.event_name,
    e.description,
    e.origin,
    e.ip ?? "",
  ];
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: EventRow[]): string {
  const lines = [MOODLE_COLUMNS.join(",")];
  for (const row of rows) lines.push(toMoodleRow(row).map(csvCell).join(","));
  // Excel opens UTF-8 CSV correctly only with a byte order mark.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
