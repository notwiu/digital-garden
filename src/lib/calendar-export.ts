
import type { CalendarEvent } from "@/services/calendar";

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatUTC(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatDay(value: string) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();

  const parts: string[] = [];
  let current = "";

  for (const char of line) {
    if (encoder.encode(current + char).length > 75) {
      parts.push(current);
      current = " ";
    }

    current += char;
  }

  parts.push(current);

  return parts.join("\r\n");
}

export function exportCalendar(events: CalendarEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Digital Garden//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
  ];

  events.forEach((event) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@digitalgarden`,
      `DTSTAMP:${formatUTC(new Date().toISOString())}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location)}`
    );

    if (event.all_day) {
      lines.push(
        `DTSTART;VALUE=DATE:${formatDay(event.start_at)}`
      );

      if (event.end_at) {
        lines.push(
          `DTEND;VALUE=DATE:${formatDay(event.end_at)}`
        );
      }
    } else {
      lines.push(`DTSTART:${formatUTC(event.start_at)}`);

      if (event.end_at) {
        lines.push(`DTEND:${formatUTC(event.end_at)}`);
      }
    }

    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob(
    [lines.map(foldLine).join("\r\n") + "\r\n"],
    { type: "text/calendar;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "digital-garden-agenda.ics";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
