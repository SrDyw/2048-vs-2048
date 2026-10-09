# 2048x2048

Juego multijugador en tiempo real basado en el clasico **2048**. Dos jugadores reciben las **mismas fichas** (semilla compartida) y compiten por la puntuacion mas alta. Incluye tambien un **modo un jugador**.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Pusher** para tiempo real (canales de presencia)
- **TailwindCSS v4** con paleta pastel
- **nanostores** para el estado del cliente
- **canvas-confetti** para el confeti

## Requisitos

- Node.js 20 o superior
- Una app de Pusher (ya incluida en `.env.local` con las claves del proyecto)

## 1) Instalar dependencias

```bash
npm install
```

## 2) Variables de entorno

El proyecto ya incluye `.env.local` con las claves de Pusher funcionales. Si necesitas recrearlo, copia `.env.example`:

```bash
# .env.local
PUSHER_APP_ID=2136796
PUSHER_KEY=ba23fd7d4676497d9857
PUSHER_SECRET=e095304d03be1fe6819f
PUSHER_CLUSTER=us3
NEXT_PUBLIC_PUSHER_KEY=ba23fd7d4676497d9857
NEXT_PUBLIC_PUSHER_CLUSTER=us3
```

## 3) Levantar el proyecto en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

> No hay servidor WebSocket propio: Pusher gestiona el tiempo real, por lo que
> un unico comando levanta todo (UI + API routes).

## 4) Probar con dos jugadores

1. Abre http://localhost:3000 en una pestana.
2. Pulsa **Crear sala** y copia el codigo de 6 caracteres.
3. Abre una **segunda pestana** (o una ventana de incognito) en la misma URL.
4. Escribe el codigo y pulsa **Entrar**.
5. En ambas pestanas pulsa **Estoy listo**. El anfitrion podra pulsar **Empezar**.
6. Tras la cuenta atras 3-2-1, mueve con las **flechas del teclado**, **gestos** en movil o los **botones** de direccion.
7. Cada jugador ve su tablero en grande y el del rival en pequeno en tiempo real.
8. Cuando un jugador no puede mover, pasa a **espectador** hasta que el otro termine.
9. Al terminar ambos se muestra la comparativa con confeti. Pulsa **Volver a jugar** para pedir la revancha (el rival debe aceptarla).

Para el **modo un jugador**, pulsa **Jugar solo** en la pantalla inicial.

## 5) Compilar para produccion

```bash
npm run build
npm start
```

## 6) Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, importa el proyecto (detecta Next.js automaticamente).
3. Anade las 6 variables de entorno en **Settings > Environment Variables**:
   `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`,
   `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.
4. Despliega.

No hace falta un servidor WebSocket aparte: las API routes de Vercel se encargan de autenticar los canales y emitir los eventos a Pusher.

## Estructura

```
src/
├── app/
│   ├── layout.tsx            # fuentes + metadata
│   ├── page.tsx              # renderiza <App/>
│   ├── globals.css           # paleta pastel, animaciones, Tailwind
│   └── api/
│       ├── pusher/auth/      # auth de canales de presencia
│       ├── room/join/        # valida que la sala exista y tenga hueco
│       └── game/event/       # emite eventos + genera la semilla
├── components/               # Home, Lobby, Countdown, GameView, Board, ResultScreen, etc.
├── hooks/useGame.ts          # suscripcion a Pusher y acciones
├── lib/                      # game2048, prng, pusher, protocolo
└── stores/gameStore.ts       # estado reactivo
```

## Notas

- La **semilla** la genera el servidor y la comparten ambos jugadores, de modo que el orden de aparicion de fichas es identico. Los tableros divergen segun las decisiones de cada uno (comportamiento correcto).
- Se respeta `prefers-reduced-motion` para desactivar animaciones.
- Sin emojis: toda la iconografia es SVG dibujado a mano.
