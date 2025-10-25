# Viajero Kanban

Tablero Kanban ligero y moderno para planificar viajes. Columnas y tarjetas permiten organizar tareas como vuelos, hoteles, equipaje, actividades y documentos. El estado es completamente del lado del cliente y se persiste localmente.

Este README está dirigido a otras IAs y desarrolladores que extenderán/mantendrán la base de código. Documenta la estructura, el estado, la semántica de arrastrar y soltar, y claros puntos de extensión.

## Funcionalidades
- React 18 + TypeScript + Vite 5
- Estado global con Zustand y persistencia en `localStorage` (clave: `vijero-kanban`)
- Arrastrar y soltar con `@dnd-kit/*`
- Reordenamiento de columnas y tarjetas (intra e inter-columna)
- Diseño simple en SCSS con efectos de glassmorphism
- Imagen de fondo opcional persistida en el estado

Las cadenas de la interfaz están mayormente en español por convención. No cambiar el idioma a menos que se solicite.

---

## Inicio rápido
- `npm install`
- `npm run dev` — iniciar el servidor de desarrollo de Vite
- `npm run build` — verificar tipos y construir el paquete de producción
- `npm run preview` — previsualizar la construcción de producción

Opcional: Abrir `ViajeroWeb.sln` en Visual Studio (con la carga de trabajo de Node.js). Presionar F5 para ejecutar `npm run dev`.

---

## Estructura del proyecto (archivos clave)
- `index.html` — HTML de entrada de la app (root)
- `src/main.tsx` — Renderizado raíz de React
- `src/app.tsx` — contenedor con encabezado/menu/fondo
- `src/styles.scss` — tokens de diseño y layout
- `src/types.ts` — tipos del dominio central
- `src/store.ts` — estado global (Zustand) y persistencia
- `src/components/board.tsx` — contexto DnD, overlays de columnas, y layout del tablero
- `src/components/column/column.tsx` — contenedor de columna con ordenamiento (control de arrastre en el encabezado)
- `src/components/column/column-content.tsx` — lista de tarjetas y formulario para añadir tarjetas
- `src/components/column/overlay-rail.tsx` — overlays droppables alineados a columnas, usados para el ordenamiento
- `src/components/card-item.tsx` — ítem de tarjeta ordenable

Nota: los nombres de los archivos están en minúsculas (ej: `board.tsx`, `app.tsx`).

---

## Modelo de datos
Definido en `src/types.ts`:

```ts
export type Id = string;

export interface Card { id: Id; title: string; description?: string; }
export interface Column { id: Id; title: string; cardIds: Id[]; }
export interface BoardState {
  columns: Record<Id, Column>;
  cards: Record<Id, Card>;
  columnOrder: Id[];
}
```

---

## Estado y acciones
El estado global está en `src/store.ts`, creado con Zustand y persistido via `persist` bajo la clave `vijero-kanban`.

Estado UI adicional:
- `backgroundUrl?: string` — URL de imagen de fondo opcional aplicada a `document.body` (ver `src/app.tsx`).

Acciones (firmas simplificadas):
- `setBackground(url?: string)` — establecer/eliminar URL de imagen de fondo.
- `addColumn(title: string)` — añadir columna al final de `columnOrder`.
- `renameColumn(id: Id, title: string)` — actualizar el título de la columna.
- `removeColumn(id: Id)` — eliminar columna, y borrar sus tarjetas de `cards`.
- `addCard(columnId: Id, title: string)` — crear una tarjeta y agregarla al final de la columna.
- `updateCard(id: Id, patch: Partial<Card>)` — mezcla superficial de campos de tarjeta.
- `removeCard(id: Id)` — eliminar tarjeta y quitar su id de todas las columnas.
- `moveCard(cardId: Id, toColumnId: Id, index: number)` —
  - Primero elimina `cardId` de todas las columnas (deduplicar),
  - Luego inserta en `toColumnId.cardIds` en el índice ajustado.
- `moveColumn(dragId: Id, overId: Id, place: 'before' | 'after' = 'after')` —
  - Reconstruye `columnOrder` removiendo `dragId`,
  - Inserta relativo a `overId` según `place`.

Los datos iniciales contienen tres columnas (Por hacer, En progreso, Hecho) y dos tarjetas de muestra.

---

## Semántica de arrastrar y soltar (dnd-kit)
Las configuraciones de DnD viven principalmente en `src/components/board.tsx`.

Identificadores y cargas útiles de datos:
- Tarjetas
  - `draggable.id = cardId`
  - `data`: `{ type: 'card', cardId, columnId }`
- Columnas
  - `draggable.id = columnId`
  - `data`: `{ type: 'column', colId: columnId }`
- Overlays de columnas (raíl de ordenamiento)
  - `droppable.id = 'ov-${index}'`
  - `data`: `{ type: 'overlay', index }`

Detección de colisiones:
- `smartCollision` personalizado
  - Al arrastrar columnas, limita las colisiones a los droppables de raíl de overlay (tipo `overlay`) para estabilizar la colocación.
  - De lo contrario, usa el puntero dentro de los droppables regulares.

Reordenamiento de columnas:
- Un `OverlayRail` de ancho completo refleja las posiciones de las columnas con droppables no interactivos.
- Durante el arrastre, `reorderByHalfThreshold` compara la X del mouse con el punto medio horizontal del overlay para decidir la inserción `before/after` con `moveColumn`.
- Funciona al apuntar a la última posición verificando el overlay separador en `index = columnOrder.length`.

Movimiento de tarjetas y reordenamiento dentro de la columna:
- Al soltar sobre una tarjeta, calcula el índice objetivo dentro de la columna de esa tarjeta y llama a `moveCard(cardId, toColumnId, insertAt)`.
- Al soltar sobre una columna o segmento de overlay, inserta al final usando `Number.MAX_SAFE_INTEGER`.
- Durante el arrastre, la tarjeta/columna original se oculta mediante CSS; un `DragOverlay` renderiza una clon en vivo.

---

## Shell de UI e imagen de fondo
`src/app.tsx` renderiza la barra superior y un menú ligero:
- "Cambiar fondo" solicita una URL de imagen y la almacena mediante `setBackground`.
- La URL se aplica a `document.body` como fondo de cubierta.
- El valor es persistente; ¿vaciarlo? para restaurar el degradado predeterminado.

---

## Estilos
- Un único archivo `src/styles.scss` con tokens para espaciado, radios, colores y efectos de glassmorphism.
- Las columnas y tarjetas usan desenfoque sutil y sombra; al arrastrar se ocultan los originales (`.is-dragging`).
- El raíl de overlay de columna usa `.column-overlays` con segmentos de ancho fijo alineados a las columnas.

---

## Convenciones
- Etiquetas/tono de UI en español; mantener a menos que se solicite la internacionalización.
- IDs generados con `nanoid`.
- Mantener los componentes pequeños y colocados bajo `src/components`.
- Evitar introducir un backend a menos que se solicite explícitamente; los datos se persistente localmente.

---

## Puntos de extensión (para implementadores de IA)
Dónde implementar cambios típicos:

- Añadir campos a `Card` (ej: fechas, ubicación, coste, enlaces, lista de verificación)
  - Actualizar `src/types.ts`
  - Ajustar formularios y renderizadores en `card-item.tsx` y posiblemente `column-content.tsx`
  - Actualizar los sitios de uso de `updateCard` si se editan nuevos campos

- Reordenamiento más preciso de tarjetas durante el arrastre
  - Mejorar la lógica de enfoque en `board.tsx` para calcular índices dinámicos usando Y del puntero vs puntos medios de vecinos
  - Considerar `@dnd-kit/sortable` personalización de sensores/estrategias

- Restricciones de colocación para columnas/tarjetas
  - Controlar en `onDragEnd` según reglas de negocio
  - Alternativamente, filtrar droppables válidos en `smartCollision`

- Presets de fondo/imágenes o carga de imágenes
  - Añadir menú de presets en `app.tsx`
  - Ampliar el almacén con una pequeña galería/lista

- i18n
  - Introducir una capa mínima de i18n (ej: diccionario de constantes `ts`) y reemplazar cadenas codificadas

- Persistencia más allá de `localStorage`
  - Añadir capa de sincronización que serialice `BoardState` a un servidor o nube; mantener local como fallback offline

- Pruebas
  - Añadir pruebas unitarias para acciones del almacén; verificar el comportamiento de deduplicación de `moveCard` y eliminaciones en cascada de `removeColumn`
  - Añadir pruebas de componentes alrededor de la lógica de intención DnD (sensores y controladores simulados)

---

## Limitaciones conocidas
- Sin backend, autenticación o multiusuario
- Sin sincronización offline más allá de `localStorage`
- La accesibilidad no ha sido auditada para DnD con teclado
- Manejo mínimo de errores en la entrada del usuario (ej: URL de fondo)

---

## Solución de problemas
- Fallo de construcción en SCSS: asegurar que `sass-embedded` esté instalado (está en `devDependencies`).
- Usuarios de Visual Studio: si F5 no ejecuta, verificar carga de trabajo de Node.js y que `npm install` se haya ejecutado correctamente.
- Rarezas de DnD con overlays provienen típicamente de anchos de columna desalineados; mantener el ancho de `.overlay-segment` en sincronía con `$col-width` en `src/styles.scss`.

---

## Licencia
No hay archivo de licencia presente. Suponer privado a menos que se añada una licencia.
