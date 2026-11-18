/** "Mid-semester exam" + "layout" + "pdf" -> "Mid-semester exam, layout.pdf" */
export function exportFileName(
  planName: string,
  kind: "layout" | "rooms",
  extension: "pdf" | "docx",
): string {
  const clean = planName
    // characters Windows and macOS refuse in file names, and control characters
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return `${clean || "Seating plan"}, ${kind}.${extension}`;
}

/** Saves bytes as a file through the browser. Nothing is uploaded. */
export function downloadBytes(
  bytes: Uint8Array,
  fileName: string,
  mime: string,
) {
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: mime }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the file.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
