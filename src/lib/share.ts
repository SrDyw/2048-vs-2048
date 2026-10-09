// Genera una imagen del resultado con el tablero y la comparte (Web Share API),
// con fallback de descarga + enlace a WhatsApp.

import type { Tile } from "./game2048";
import {
  ACCENT,
  ACCENT_2,
  BOARD_BG,
  CELL_BG,
  PAGE_BG,
  TEXT_COLOR,
  TEXT_MUTED,
  isHighValue,
  tileColors,
} from "./tileColors";

export interface ShareResultData {
  headline: string;
  myScore: number;
  opponentScore?: number;
  myTiles: Tile[];
  opponentTiles?: Tile[];
  solo: boolean;
}

const W = 1080;
const H = 1920;
const BOARD_SIZE = 4;

// Dibuja un rectangulo con esquinas redondeadas.
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Tamano de fuente segun el valor de la ficha.
function fontFactor(value: number): number {
  if (value < 100) return 0.42;
  if (value < 1000) return 0.34;
  if (value < 10000) return 0.27;
  return 0.22;
}

// Dibuja un tablero completo en el canvas.
function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tiles: Tile[]
) {
  roundRect(ctx, x, y, size, size, size * 0.05);
  ctx.fillStyle = BOARD_BG;
  ctx.fill();

  const gap = size * 0.03;
  const cell = (size - gap * (BOARD_SIZE + 1)) / BOARD_SIZE;
  const corner = cell * 0.18;

  // Celdas vacias.
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      roundRect(
        ctx,
        x + gap + col * (cell + gap),
        y + gap + row * (cell + gap),
        cell,
        cell,
        corner
      );
      ctx.fillStyle = CELL_BG;
      ctx.fill();
    }
  }

  // Fichas.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const tile of tiles) {
    const tx = x + gap + tile.col * (cell + gap);
    const ty = y + gap + tile.row * (cell + gap);
    roundRect(ctx, tx, ty, cell, cell, corner);

    if (isHighValue(tile.value)) {
      const grad = ctx.createLinearGradient(tx, ty, tx + cell, ty + cell);
      grad.addColorStop(0, "#a97fe0");
      grad.addColorStop(0.5, "#ef85a2");
      grad.addColorStop(1, "#f0c530");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = tileColors(tile.value).bg;
    }
    ctx.fill();

    ctx.fillStyle = tileColors(tile.value).fg;
    ctx.font = `800 ${cell * fontFactor(tile.value)}px Nunito, sans-serif`;
    ctx.fillText(String(tile.value), tx + cell / 2, ty + cell / 2 + cell * 0.02);
  }
}

// Envuelve un texto en varias lineas dentro de un ancho maximo.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Genera la imagen del resultado como Blob PNG.
export async function renderShareCard(
  data: ShareResultData,
  url: string
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Seguimos aunque la fuente no este lista.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo.
  ctx.fillStyle = PAGE_BG;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Logo con degradado.
  const logoGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  logoGrad.addColorStop(0, ACCENT);
  logoGrad.addColorStop(1, ACCENT_2);
  ctx.fillStyle = logoGrad;
  ctx.font = "800 92px 'Baloo 2', Nunito, sans-serif";
  ctx.fillText("2048×2048", W / 2, 170);

  // Titulo del resultado.
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "800 62px Nunito, sans-serif";
  ctx.fillText(data.headline, W / 2, 270);

  // Puntuacion principal.
  ctx.fillStyle = ACCENT;
  ctx.font = "800 150px Nunito, sans-serif";
  ctx.fillText(String(data.myScore), W / 2, 430);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "700 40px Nunito, sans-serif";
  ctx.fillText("puntos", W / 2, 490);

  // Tableros.
  if (data.solo) {
    const size = 760;
    drawBoard(ctx, (W - size) / 2, 560, size, data.myTiles);
  } else {
    const size = 450;
    const gap = 60;
    const totalW = size * 2 + gap;
    const startX = (W - totalW) / 2;
    const y = 600;

    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "700 40px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tu", startX + size / 2, y - 24);
    ctx.fillText("Rival", startX + size + gap + size / 2, y - 24);

    drawBoard(ctx, startX, y, size, data.myTiles);
    drawBoard(ctx, startX + size + gap, y, size, data.opponentTiles ?? []);

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "800 46px Nunito, sans-serif";
    ctx.fillText("vs", W / 2, y + size / 2);
    ctx.fillStyle = PAGE_BG;
    roundRect(ctx, W / 2 - 44, y + size / 2 - 58, 88, 76, 20);
    ctx.fill();
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "800 46px Nunito, sans-serif";
    ctx.fillText(
      `Rival ${data.opponentScore ?? 0}`,
      W / 2,
      y + size + 70
    );
  }

  // Pie: invitacion + enlace.
  const invite =
    data.solo
      ? `He conseguido ${data.myScore} puntos en 2048×2048. ¿Puedes superarme?`
      : `${data.headline} en 2048×2048 (${data.myScore} vs ${data.opponentScore ?? 0}). ¿Te atreves?`;

  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "700 48px Nunito, sans-serif";
  const lines = wrapText(ctx, invite, W - 200);
  let fy = H - 300;
  for (const line of lines) {
    ctx.fillText(line, W / 2, fy);
    fy += 60;
  }

  // Enlace destacado.
  ctx.fillStyle = ACCENT_2;
  ctx.font = "800 46px Nunito, sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, fy + 20);

  // Enlace al proyecto en GitHub.
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "600 30px Nunito, sans-serif";
  ctx.fillText("github.com/SrDyw/2048-vs-2048", W / 2, H - 50);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}

// Texto de invitacion que acompana al enlace.
function buildShareText(data: ShareResultData, url: string): string {
  if (data.solo) {
    return `He conseguido ${data.myScore} puntos en 2048x2048. ¿Puedes superarme? Juega aqui: ${url}`;
  }
  return `${data.headline} en 2048x2048 (${data.myScore} vs ${data.opponentScore ?? 0}). ¿Te atreves a jugar? ${url}`;
}

// Descarga un Blob como archivo.
function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
}

export type ShareOutcome = "shared" | "fallback";

// Comparte el resultado. Usa la hoja nativa si puede; si no, descarga + wa.me.
export async function shareResult(
  data: ShareResultData
): Promise<ShareOutcome> {
  const url =
    typeof window !== "undefined" ? window.location.origin : "https://2048x2048.app";
  const blob = await renderShareCard(data, url);
  const text = buildShareText(data, url);
  const file = new File([blob], "2048x2048.png", { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], text, url });
      return "shared";
    } catch (error) {
      // Si el usuario cancela, no hacemos nada mas.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
      // Otro error: caemos al fallback.
    }
  }

  // Fallback: descargar la imagen y abrir WhatsApp con el texto.
  downloadBlob(blob, "2048x2048.png");
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  return "fallback";
}
