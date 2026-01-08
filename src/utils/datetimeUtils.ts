/**
 * Convert ISO datetime string -> "YYYY-MM-DDTHH:mm"
 * (format phù hợp cho input type="datetime-local")
 */
export function isoToDateTimeLocal(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "";

  // Format thành YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert từ datetime-local -> ISO string (UTC)
 * example: "2025-02-13T09:30" -> "2025-02-13T02:30:00.000Z"
 */
export function datetimeLocalToISO(value?: string): string | null {
  if (!value || value.trim() === "") return null;

  const date = new Date(value);

  if (isNaN(date.getTime())) return null;

  return date.toISOString();
}

/**
 * Convert Date object → ISO without seconds (optional helper)
 */
export function dateToISOWithoutSeconds(date?: Date): string {
  if (!date) return "";
  if (isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}
