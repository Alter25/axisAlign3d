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
| front-left     |   7.883 | -26.000 |  91.324 |
| front-right    |  84.321 | -26.000 |  13.610 |
| back-left      |  38.284 | -26.000 | 122.020 |
| back-right     | 116.821 | -26.000 |  43.338 |

## Offsets por Dirección (DIRECTION_OFFSETS)

| Dirección      |       X |       Y |       Z |
|:---------------|--------:|--------:|--------:|
| vertical       |  -3.506 |   0.000 |   3.500 |
| horizontal     |   0.001 | -10.000 |  -1.414 |

## Posiciones Finales (pata + offset)

| Flecha                  |       X |       Y |       Z |
|:------------------------|--------:|--------:|--------:|
| front-left·vertical    |   4.377 | -26.000 |  94.824 |
| front-left·horizontal  |   7.885 | -36.000 |  89.909 |
| front-left·axial       |   7.883 | -26.000 |  91.324 |
| front-right·vertical   |  80.814 | -26.000 |  17.110 |
| front-right·horizontal |  84.322 | -36.000 |  12.196 |
| front-right·axial      |  84.321 | -26.000 |  13.610 |
| back-left·vertical     |  34.777 | -26.000 | 125.520 |
| back-left·horizontal   |  38.285 | -36.000 | 120.606 |
| back-left·axial        |  38.284 | -26.000 | 122.020 |
| back-right·vertical    | 113.315 | -26.000 |  46.838 |
| back-right·horizontal  | 116.822 | -36.000 |  41.924 |
| back-right·axial       | 116.821 | -26.000 |  43.338 |

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
  'front-left': [7.883, -26.000, 91.324] as [number, number, number],
  'front-right': [84.321, -26.000, 13.610] as [number, number, number],
  'back-left': [38.284, -26.000, 122.020] as [number, number, number],
  'back-right': [116.821, -26.000, 43.338] as [number, number, number],
}

export const DIRECTION_OFFSETS = {
  vertical    : [-3.506, 0.000, 3.500] as [number, number, number],
  horizontal  : [0.001, -10.000, -1.414] as [number, number, number],
  axial       : [0.000, 0.000, 0.000] as [number, number, number],
}

export const ARROW_SCALE = 30
```
