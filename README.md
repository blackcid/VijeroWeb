# Viajero Kanban

Tablero Kanban ligero y moderno para planificar viajes. Columnas y tarjetas permiten organizar tareas como vuelos, hoteles, equipaje, actividades y documentos. El estado es completamente del lado del cliente y se persiste localmente.

Este README est� dirigido a otras IAs y desarrolladores que extender�n/mantendr�n la base de c�digo. Documenta la estructura, el estado, la sem�ntica de arrastrar y soltar, y claros puntos de extensi�n.

## Funcionalidades
- React 18 + TypeScript + Vite 5
- Estado global con Zustand y persistencia en `localStorage` (clave: `vijero-kanban`)
- Arrastrar y soltar con `@dnd-kit/*`
- Reordenamiento de columnas y tarjetas (intra e inter-columna)
- Dise�o simple en SCSS con efectos de glassmorphism
- Imagen de fondo opcional persistida en el estado

Las cadenas de la interfaz est�n mayormente en espa�ol por convenci�n. No cambiar el idioma a menos que se solicite.

---

## Inicio r�pido
- `npm install`
- `npm run dev` � iniciar el servidor de desarrollo de Vite
- `npm run build` � verificar tipos y construir el paquete de producci�n
- `npm run preview` � previsualizar la construcci�n de producci�n

Opcional: Abrir `ViajeroWeb.sln` en Visual Studio (con la carga de trabajo de Node.js). Presionar F5 para ejecutar `npm run dev`.

---

## Estructura del proyecto (archivos clave)
- `index.html` � HTML de entrada de la app (root)
- `src/main.tsx` � Renderizado ra�z de React
- `src/app.tsx` � contenedor con encabezado/menu/fondo
- `src/styles.scss` � tokens de dise�o y layout
- `src/types.ts` � tipos del dominio central
- `src/store.ts` � estado global (Zustand) y persistencia
- `src/components/board.tsx` � contexto DnD, overlays de columnas, y layout del tablero
- `src/components/column/column.tsx` � contenedor de columna con ordenamiento (control de arrastre en el encabezado)
- `src/components/column/column-content.tsx` � lista de tarjetas y formulario para a�adir tarjetas
- `src/components/column/overlay-rail.tsx` � overlays droppables alineados a columnas, usados para el ordenamiento
- `src/components/card-item.tsx` � �tem de tarjeta ordenable

Nota: los nombres de los archivos est�n en min�sculas (ej: `board.tsx`, `app.tsx`).

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
El estado global est� en `src/store.ts`, creado con Zustand y persistido via `persist` bajo la clave `vijero-kanban`.

Estado UI adicional:
- `backgroundUrl?: string` � URL de imagen de fondo opcional aplicada a `document.body` (ver `src/app.tsx`).

Acciones (firmas simplificadas):
- `setBackground(url?: string)` � establecer/eliminar URL de imagen de fondo.
- `addColumn(title: string)` � a�adir columna al final de `columnOrder`.
- `renameColumn(id: Id, title: string)` � actualizar el t�tulo de la columna.
- `removeColumn(id: Id)` � eliminar columna, y borrar sus tarjetas de `cards`.
- `addCard(columnId: Id, title: string)` � crear una tarjeta y agregarla al final de la columna.
- `updateCard(id: Id, patch: Partial<Card>)` � mezcla superficial de campos de tarjeta.
- `removeCard(id: Id)` � eliminar tarjeta y quitar su id de todas las columnas.
- `moveCard(cardId: Id, toColumnId: Id, index: number)` �
  - Primero elimina `cardId` de todas las columnas (deduplicar),
  - Luego inserta en `toColumnId.cardIds` en el �ndice ajustado.
- `moveColumn(dragId: Id, overId: Id, place: 'before' | 'after' = 'after')` �
  - Reconstruye `columnOrder` removiendo `dragId`,
  - Inserta relativo a `overId` seg�n `place`.

Los datos iniciales contienen tres columnas (Por hacer, En progreso, Hecho) y dos tarjetas de muestra.

---

## Sem�ntica de arrastrar y soltar (dnd-kit)
Las configuraciones de DnD viven principalmente en `src/components/board.tsx`.

Identificadores y cargas �tiles de datos:
- Tarjetas
  - `draggable.id = cardId`
  - `data`: `{ type: 'card', cardId, columnId }`
- Columnas
  - `draggable.id = columnId`
  - `data`: `{ type: 'column', colId: columnId }`
- Overlays de columnas (ra�l de ordenamiento)
  - `droppable.id = 'ov-${index}'`
  - `data`: `{ type: 'overlay', index }`

Detecci�n de colisiones:
- `smartCollision` personalizado
  - Al arrastrar columnas, limita las colisiones a los droppables de ra�l de overlay (tipo `overlay`) para estabilizar la colocaci�n.
  - De lo contrario, usa el puntero dentro de los droppables regulares.

Reordenamiento de columnas:
- Un `OverlayRail` de ancho completo refleja las posiciones de las columnas con droppables no interactivos.
- Durante el arrastre, `reorderByHalfThreshold` compara la X del mouse con el punto medio horizontal del overlay para decidir la inserci�n `before/after` con `moveColumn`.
- Funciona al apuntar a la �ltima posici�n verificando el overlay separador en `index = columnOrder.length`.

Movimiento de tarjetas y reordenamiento dentro de la columna:
- Al soltar sobre una tarjeta, calcula el �ndice objetivo dentro de la columna de esa tarjeta y llama a `moveCard(cardId, toColumnId, insertAt)`.
- Al soltar sobre una columna o segmento de overlay, inserta al final usando `Number.MAX_SAFE_INTEGER`.
- Durante el arrastre, la tarjeta/columna original se oculta mediante CSS; un `DragOverlay` renderiza una clon en vivo.

---

## Shell de UI e imagen de fondo
`src/app.tsx` renderiza la barra superior y un men� ligero:
- "Cambiar fondo" solicita una URL de imagen y la almacena mediante `setBackground`.
- La URL se aplica a `document.body` como fondo de cubierta.
- El valor es persistente; �vaciarlo? para restaurar el degradado predeterminado.

---

## Estilos
- Un �nico archivo `src/styles.scss` con tokens para espaciado, radios, colores y efectos de glassmorphism.
- Las columnas y tarjetas usan desenfoque sutil y sombra; al arrastrar se ocultan los originales (`.is-dragging`).
- El ra�l de overlay de columna usa `.column-overlays` con segmentos de ancho fijo alineados a las columnas.

---

## Convenciones
- Etiquetas/tono de UI en espa�ol; mantener a menos que se solicite la internacionalizaci�n.
- IDs generados con `nanoid`.
- Mantener los componentes peque�os y colocados bajo `src/components`.
- Evitar introducir un backend a menos que se solicite expl�citamente; los datos se persistente localmente.

---

## Puntos de extensi�n (para implementadores de IA)
D�nde implementar cambios t�picos:

- A�adir campos a `Card` (ej: fechas, ubicaci�n, coste, enlaces, lista de verificaci�n)
  - Actualizar `src/types.ts`
  - Ajustar formularios y renderizadores en `card-item.tsx` y posiblemente `column-content.tsx`
  - Actualizar los sitios de uso de `updateCard` si se editan nuevos campos

- Reordenamiento m�s preciso de tarjetas durante el arrastre
  - Mejorar la l�gica de enfoque en `board.tsx` para calcular �ndices din�micos usando Y del puntero vs puntos medios de vecinos
  - Considerar `@dnd-kit/sortable` personalizaci�n de sensores/estrategias

- Restricciones de colocaci�n para columnas/tarjetas
  - Controlar en `onDragEnd` seg�n reglas de negocio
  - Alternativamente, filtrar droppables v�lidos en `smartCollision`

- Presets de fondo/im�genes o carga de im�genes
  - A�adir men� de presets en `app.tsx`
  - Ampliar el almac�n con una peque�a galer�a/lista

- i18n
  - Introducir una capa m�nima de i18n (ej: diccionario de constantes `ts`) y reemplazar cadenas codificadas

- Persistencia m�s all� de `localStorage`
  - A�adir capa de sincronizaci�n que serialice `BoardState` a un servidor o nube; mantener local como fallback offline

- Pruebas
  - A�adir pruebas unitarias para acciones del almac�n; verificar el comportamiento de deduplicaci�n de `moveCard` y eliminaciones en cascada de `removeColumn`
  - A�adir pruebas de componentes alrededor de la l�gica de intenci�n DnD (sensores y controladores simulados)

---

## Limitaciones conocidas
- Sin backend, autenticaci�n o multiusuario
- Sin sincronizaci�n offline m�s all� de `localStorage`
- La accesibilidad no ha sido auditada para DnD con teclado
- Manejo m�nimo de errores en la entrada del usuario (ej: URL de fondo)

---

## Soluci�n de problemas
- Fallo de construcci�n en SCSS: asegurar que `sass-embedded` est� instalado (est� en `devDependencies`).
- Usuarios de Visual Studio: si F5 no ejecuta, verificar carga de trabajo de Node.js y que `npm install` se haya ejecutado correctamente.
- Rarezas de DnD con overlays provienen t�picamente de anchos de columna desalineados; mantener el ancho de `.overlay-segment` en sincron�a con `$col-width` en `src/styles.scss`.

---

## Licencia
No hay archivo de licencia presente. Suponer privado a menos que se a�ada una licencia.
