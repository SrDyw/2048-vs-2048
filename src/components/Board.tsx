"use client";

import { useEffect, useRef, useState } from "react";
import { BOARD_SIZE, type Tile as TileModel } from "@/lib/game2048";
import { cn } from "@/lib/cn";

interface BoardProps {
  tiles: TileModel[];
  // Version reducida (tablero del rival).
  compact?: boolean;
}

// Tablero 4x4 con fichas posicionadas por transform para animar el deslizamiento.
export function Board({ tiles, compact = false }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Mide el ancho del contenedor y lo mantiene actualizado.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setWidth(el.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gap = width * 0.03;
  const cell = (width - gap * (BOARD_SIZE + 1)) / BOARD_SIZE;

  const position = (index: number) => gap + index * (cell + gap);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full aspect-square rounded-2xl", compact && "board-compact")}
      style={{ backgroundColor: "var(--color-tablero)", boxShadow: "var(--shadow-suave)" }}
    >
      {/* Celdas vacias de fondo */}
      {width > 0 &&
        Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          return (
            <div
              key={`cell-${i}`}
              className="absolute rounded-[12px]"
              style={{
                width: cell,
                height: cell,
                transform: `translate(${position(col)}px, ${position(row)}px)`,
                backgroundColor: "var(--color-celda)",
              }}
            />
          );
        })}

      {/* Fichas */}
      {width > 0 &&
        tiles.map((tile) => (
          <TileView
            key={tile.id}
            tile={tile}
            size={cell}
            x={position(tile.col)}
            y={position(tile.row)}
          />
        ))}
    </div>
  );
}

interface TileViewProps {
  tile: TileModel;
  size: number;
  x: number;
  y: number;
}

// Devuelve la clase de color segun el valor de la ficha.
function valueClass(value: number): string {
  if (value <= 2048) return `tile-value-${value}`;
  return "tile-value-high";
}

// Tamaño de fuente adaptado a la longitud del numero.
function fontFactor(value: number): number {
  if (value < 100) return 0.42;
  if (value < 1000) return 0.34;
  if (value < 10000) return 0.27;
  return 0.22;
}

function TileView({ tile, size, x, y }: TileViewProps) {
  return (
    <div
      className={cn(
        "tile",
        tile.moving && "tile-moving",
        tile.merged && "tile-merge"
      )}
      style={{
        width: size,
        height: size,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div
        className={cn(
          "tile-inner",
          valueClass(tile.value),
          tile.isNew && "tile-new"
        )}
        style={{
          fontSize: size * fontFactor(tile.value),
          fontWeight: 700,
        }}
      >
        {tile.value}
      </div>
    </div>
  );
}
