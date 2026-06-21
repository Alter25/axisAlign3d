# Configuración de Posiciones de Flechas

> Generado: 2026-06-21
> Copiar constantes en `src/shared/lib/constants.ts`

---

## Eje del Equipo (axisPoints)

| Punto |       X |       Y |       Z |
|:------|--------:|--------:|--------:|
| x1             | 237.000 |   0.000 | 243.000 |
| x2             | -320.000 |   0.000 | -315.000 |
| z              | -16.000 |   0.000 |   5.000 |

## Posiciones de Patas (PATA_POSITIONS)

| Pata           |       X |       Y |       Z |
|:---------------|--------:|--------:|--------:|
| front-left     |   9.000 |  -0.500 | -33.837 |
| front-right    |  -9.633 |  -0.500 | -54.944 |
| back-left      |  38.284 | -26.000 | 122.020 |
| back-right     | 126.553 |  -0.500 |  41.481 |

## Offsets por Dirección (DIRECTION_OFFSETS)

| Dirección      |       X |       Y |       Z |
|:---------------|--------:|--------:|--------:|
| vertical       |   0.000 |  -0.300 |   0.000 |
| horizontal     |   0.000 |   0.000 |   0.000 |

## Posiciones Finales (pata + offset)

| Flecha                  |       X |       Y |       Z |
|:------------------------|--------:|--------:|--------:|
| front-left·vertical    |   9.000 |  -0.800 | -33.837 |
| front-left·horizontal  |   9.000 |  -0.500 | -33.837 |
| front-right·vertical   |  -9.633 |  -0.800 | -54.944 |
| front-right·horizontal |  -9.633 |  -0.500 | -54.944 |
| back-left·vertical     |  38.284 | -26.300 | 122.020 |
| back-left·horizontal   |  38.284 | -26.000 | 122.020 |
| back-right·vertical    | 126.553 |  -0.800 |  41.481 |
| back-right·horizontal  | 126.553 |  -0.500 |  41.481 |

## Tamaños

`arrowScale: 30`  `markerSize: 24`

---

## Constantes TypeScript (copiar a constants.ts)

```typescript
export const AXIS_POINTS = {
  x1: [237.000, 0.000, 243.000] as [number, number, number],
  x2: [-320.000, 0.000, -315.000] as [number, number, number],
  z:  [-16.000, 0.000, 5.000]  as [number, number, number],
}

export const PATA_POSITIONS = {
  'front-left': [9.000, -0.500, -33.837] as [number, number, number],
  'front-right': [-9.633, -0.500, -54.944] as [number, number, number],
  'back-left': [38.284, -26.000, 122.020] as [number, number, number],
  'back-right': [126.553, -0.500, 41.481] as [number, number, number],
}

export const DIRECTION_OFFSETS = {
  vertical    : [0.000, -0.300, 0.000] as [number, number, number],
  horizontal  : [0.000, 0.000, 0.000] as [number, number, number],
}

export const ARROW_SCALE = 30
```
