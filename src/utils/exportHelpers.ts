export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export async function downloadProjectZip(): Promise<void> {
  const res = await fetch('/api/download-zip', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Zip download failed (${res.status})`);
  }
  const blob = await res.blob();
  downloadBlob(blob, 'omnigpt-source.zip');
}

export function sanitizeFilename(name: string, fallback = 'gengpt-file.txt'): string {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  return cleaned || fallback;
}

export async function exportSvgAsPng(
  svgCode: string,
  filename: string,
  width = 1024,
  height = 1024
): Promise<void> {
  const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

    const scale = 2;
    const targetW = Math.max(512, Math.min(2048, width * scale));
    const targetH = Math.max(512, Math.min(2048, height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
    );
    if (!pngBlob) throw new Error('PNG conversion failed');
    downloadBlob(pngBlob, sanitizeFilename(filename.replace(/\.svg$/i, '') + '.png', 'gengpt-art.png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function parseCsvPreview(csvText: string, maxRows = 50): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
    if (rows.length >= maxRows) break;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
