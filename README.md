# Viajero Kanban

Kanban simple para organizar viajes. Permite crear columnas y tarjetas (tareas) para planificar, ejecutar y hacer seguimiento de un viaje: reservar vuelos, hoteles, preparar equipaje, actividades, etc.

## Objetivo
- Visualizar el flujo del viaje por fases (por ejemplo: Por hacer, En progreso, Hecho) o por categor�as (Transporte, Alojamiento, Actividades, Documentaci�n).
- Reordenar tareas entre columnas mediante arrastrar y soltar.
- Persistir el estado en el navegador (sin backend por ahora).

## Tecnolog�as
- React 18 + TypeScript
- Vite 5 (dev/build)
- Zustand (estado + persistencia en `localStorage`)
- @dnd-kit/core (arrastrar/soltar)
- nanoid (IDs)

## Scripts
- `npm install`: instala dependencias
- `npm run dev`: desarrollo con Vite
- `npm run build`: compila TypeScript y genera producci�n
- `npm run preview`: sirve la build

## Estructura relevante
- `src/store.ts`: estado global `BoardState` y acciones (a�adir/renombrar/quitar columnas, a�adir/actualizar/quitar/mover tarjetas). Persistencia con clave `vijero-kanban`.
- `src/types.ts`:
  - `Card { id, title, description? }`
  - `Column { id, title, cardIds: Id[] }`
  - `BoardState { columns: Record<Id, Column>, cards: Record<Id, Card>, columnOrder: Id[] }`
- `src/components/Board.tsx`: layout del tablero, bot�n �Nueva columna�, contexto de DnD y render de columnas.
- `src/components/Column.tsx`: columna droppable, rename/remove, lista de tarjetas y formulario de alta.
- `src/components/CardItem.tsx`: tarjeta draggable, edici�n inline, eliminar.
- `src/App.tsx`: app ra�z; puede usar directamente `<Board />`.

## Arrastrar y soltar (dnd-kit)
- Cada tarjeta es draggable con `id = cardId`.
- Cada columna es droppable con `id = columnId`.
- En `onDragEnd` se llama a `moveCard(cardId, overColumnId, Number.MAX_SAFE_INTEGER)`, insertando al final de la columna destino.

Mejoras posibles:
- Reordenamiento dentro de la misma columna (establecer �ndice seg�n posici�n de inserci�n).
- Previsualizaci�n/overlay durante drag.
- Restricciones (no permitir soltar en ciertas columnas/casos).

## Persistencia
- Local �nicamente (`localStorage`) mediante `zustand/middleware/persist`.
- No hay backend ni autenticaci�n.

## Visual Studio (opcional)
- Existe `ViajeroWeb.sln` y `ViajeroWeb.njsproj` para abrir y depurar con el workload �Node.js development�.
- Ejecutar `npm install` y F5 lanzar� `npm run dev`.

## Convenciones
- UI en espa�ol.
- IDs con `nanoid`.
- Estilos en `src/styles.css`.

## Ideas para enfoque de viajes
- Columnas t�picas: Planificaci�n, Reservas, Documentaci�n, Equipaje, Itinerario, Pagos, Hecho.
- Campos extra futuros en `Card`: fechas, lugar, coste, enlace/reserva, checklist.
- Exportaci�n/compartici�n, sincronizaci�n en la nube, PWA/offline.

## Limitaciones actuales
- Sin backend ni multiusuario.
- Orden de inserci�n al final al mover tarjetas (sin c�lculo de �ndice por posici�n).
- Sin tests automatizados.

## Gu�a r�pida para otras IAs
- Contexto: tablero Kanban para organizar viajes; estado en `zustand` (`src/store.ts`).
- Puntos de extensi�n: `moveCard`, `addCard`, `renameColumn`, soporte de reordenamiento intra-columna, nuevos campos en `Card`.
- Mantener UI y textos en espa�ol. Evitar introducir backend salvo que se solicite.
- Si se modifica DnD, revisar `Board.tsx` y `Column.tsx`.
