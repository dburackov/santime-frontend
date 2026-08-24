import type { DownloadedFile } from '@/api/client';

export function saveFile({ blob, filename }: DownloadedFile, fallbackName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
