// Turns a document into a PDF or PNG on the device, then shares it (WhatsApp via the share sheet) or downloads it.
import { h, render } from 'preact';
import { api } from '../lib';
import { DocSheet, DOC_TITLE } from './DocSheet';

export type Format = 'pdf' | 'png';

/** Renders the document off-screen at A4 width and captures it as a canvas. */
async function capture(token: string, format: Format): Promise<{ canvas: HTMLCanvasElement; doc: any }> {
  const { invoice: doc } = await api(`/public/invoice/${token}`);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:0;left:-10000px;width:794px;background:#fff;z-index:-1';
  document.body.appendChild(host);
  try {
    render(h(DocSheet, { doc, forExport: format }), host);
    await document.fonts.ready;
    await Promise.all([...host.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
    const { default: html2canvas } = await import('html2canvas-pro');
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    return { canvas, doc };
  } finally {
    render(null, host);
    host.remove();
  }
}

async function toFile(canvas: HTMLCanvasElement, doc: any, format: Format): Promise<File> {
  const base = `${DOC_TITLE[doc.doc_status] ?? 'فاتورة'}-${doc.number}`;
  if (format === 'png') {
    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'));
    return new File([blob], `${base}.png`, { type: 'image/png' });
  }
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageW = 210, pageH = 297;
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL('image/jpeg', 0.92);
  // Long documents continue on extra pages.
  // A few mm of rounding past the page end must not start a new (blank) page.
  for (let y = 0, page = 0; y < imgH - 3; y += pageH, page++) {
    if (page) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, -y, pageW, imgH);
  }
  return new File([pdf.output('blob')], `${base}.pdf`, { type: 'application/pdf' });
}

function download(file: File) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/**
 * Creates the file and opens the phone's share sheet (pick WhatsApp, then the customer).
 * Where sharing files is not supported (most desktops), downloads the file and opens the customer's WhatsApp chat
 * so it can be attached. Returns how it was delivered.
 */
export async function shareDoc(token: string, format: Format, opts: { phone?: string; text?: string } = {}): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const { canvas, doc } = await capture(token, format);
  const file = await toFile(canvas, doc, format);
  const text = opts.text ?? `${DOC_TITLE[doc.doc_status] ?? 'فاتورة'} ${doc.number} من شلال بيروت`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: file.name });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  download(file);
  if (opts.phone) window.open(`https://wa.me/${opts.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return 'downloaded';
}

export async function downloadDoc(token: string, format: Format) {
  const { canvas, doc } = await capture(token, format);
  download(await toFile(canvas, doc, format));
}
