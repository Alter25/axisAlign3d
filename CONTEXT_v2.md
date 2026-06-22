# 🔧 Bomba Alignment App - Context v2

## 📋 Stack Exacto

```
Package Manager: Bun
Framework Web:  React 19+ (Vite)
Framework App:  React Native (Fase 2)
Language:       TypeScript (strict mode)
3D Library:     Three.js + @react-three/fiber + @react-three/drei
Styling Web:    Tailwind CSS v4
Styling Mobile: React Native StyleSheet (fase 2)
```

---

## 📁 Estructura de Carpetas (Monorepo-like)

```
bomba-alignment-app/
├── src/
│   ├── web/                              ← Código específico Web (React + Vite)
│   │   ├── pages/
│   │   │   └── Home.tsx                  ← Página principal
│   │   │
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   ├── Scene.tsx             ← Canvas 3D (react-three-fiber)
│   │   │   │   ├── EquipmentModel.tsx    ← Carga GLB del modelo
│   │   │   │   └── ArrowIndicators.tsx   ← Flechas sobre modelo (condicionales)
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── ReadingForm.tsx       ← Formulario de entrada
│   │   │       ├── CorrectionSteps.tsx   ← Pasos de corrección
│   │   │       └── Dashboard.tsx         ← Layout principal
│   │   │
│   │   ├── App.tsx                       ← Componente raíz
│   │   ├── main.tsx                      ← Entry point Vite
│   │   └── index.css                     ← Tailwind imports
│   │
│   ├── mobile/                           ← Código específico Mobile (React Native)
│   │   ├── screens/
│   │   │   └── HomeScreen.tsx            ← Pantalla principal (fase 2)
│   │   │
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   └── Scene3D.tsx           ← Canvas 3D para mobile
│   │   │   │
│   │   │   └── ui/
│   │   │       └── ReadingForm.tsx       ← Formulario mobile
│   │   │
│   │   ├── App.tsx                       ← Componente raíz
│   │   └── index.ts                      ← Entry point
│   │
│   ├── shared/                           ← Código compartido (Web + Mobile)
│   │   ├── lib/
│   │   │   ├── alignment-calc.ts         ← Lógica de cálculos (TypeScript puro)
│   │   │   ├── geometry-utils.ts         ← Utilidades geométricas
│   │   │   └── constants.ts              ← Constantes ISO, umbrales, etc
│   │   │
│   │   ├── types/
│   │   │   └── alignment.ts              ← Tipos compartidos
│   │   │
│   │   └── hooks/                        ← Hooks compartidos (solo para Web, fase 2 mobile)
│   │       └── useAlignmentCalculations.ts
│   │
│   └── assets/
│       └── models/
│           └── pump-motor-assembly.glb   ← Modelo 3D Blender (completo)
│
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── bunfig.toml
└── package.json
```

---

## 🎯 Convenciones de Archivos

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `.tsx` (Web) | `src/web/` | Componentes React Web |
| `.tsx` (Mobile) | `src/mobile/` | Componentes React Native (fase 2) |
| `.ts` (Shared) | `src/shared/lib/` | Lógica pura sin dependencias |
| `.ts` (Types) | `src/shared/types/` | Interfaces compartidas |
| `.ts` (Hooks) | `src/shared/hooks/` | Custom hooks (Web primero, mobile después) |

### Reglas Estrictas
- ✅ Lógica pura en `src/shared/lib/` (TypeScript sin React)
- ✅ Tipos en `src/shared/types/` (reutilizable en Web y Mobile)
- ✅ Componentes Web en `src/web/` (React)
- ✅ Componentes Mobile en `src/mobile/` (React Native - fase 2)
- ❌ NO agregar dependencias web en `shared/`
- ❌ NO mezclar lógica web/mobile

---

## 👨‍🔧 Contexto del Usuario

**Mecánico especialista en alineación de ejes** con experiencia en desarrollo web auto-didacta.

### Expertise
- Alineación bomba-motor-ejes
- Análisis de vibración (vertical/horizontal, fase)
- Cálculos trigonométricos aplicados
- Runout axial/radial, desplazamientos
- ISO 10816 (estándares de vibración)

### Experiencia Tech
- React, TypeScript, Tailwind CSS
- Bun como package manager
- Astro, Next.js, Vite
- Three.js, 3D visualization
- Self-taught full-stack developer

---

## 🎨 Requisitos Funcionales

### Fase 1: Web (React + Vite)

#### 1.1 Visualización 3D
- ✅ Cargar modelo GLB completo (bomba + motor + ejes + acoples)
- ✅ Canvas Three.js responsivo (mobile-first)
- ✅ Orbit controls (rotación, zoom, pan)
- ✅ Iluminación adecuada
- ✅ Optimización: `dpr={[1, 2]}`, antialias

#### 1.2 Sistema de Flechas Condicionales
**CLAVE:** Las flechas se muestran SOLO si existen correcciones para esa dirección.

Ejemplos:
```
Si vibración vertical > umbral:
  → Mostrar flecha VERTICAL en motor o bomba

Si vibración horizontal > umbral:
  → Mostrar flecha HORIZONTAL en bomba o motor

Si runout axial > umbral:
  → Mostrar flecha AXIAL en eje
```

Propiedades de cada flecha:
- **Posición:** Hardcodeada en el modelo (pedal, soporte, etc)
- **Dirección:** Calculada desde los datos de entrada
- **Color:** Según prioridad (1=rojo crítico, 2=amarillo warn, 3=cian info)
- **Animación:** Solo prioridad 1 (pulse/float)
- **Visibilidad:** Condicional a correcciones

#### 1.3 Formulario de Entrada
Usuario ingresa:
```
Vibración vertical (mm/s)
Vibración horizontal (mm/s)
Fase vertical (0-360°)
Fase horizontal (0-360°)
Runout axial (micrones)
Runout radial (micrones)
Temperatura rodamientos (opcional)
```

#### 1.4 Cálculo Automático
- Procesa entrada
- Genera correcciones
- Ordena por prioridad
- Calcula posición/dirección de flechas

#### 1.5 Visualización de Pasos
Muestra pasos de corrección ordenados:
1. Críticos (rojo)
2. Advertencia (amarillo)
3. Info (cian)

### Fase 2: Mobile (React Native)
- Mismo `src/shared/` (lógica y tipos)
- Componentes React Native
- 3D rendering nativo (expo-three o similar)
- UI adaptada a mobile

---

## 📦 Dependencias

### Web (src/web/)
```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "typescript": "^5",
    "three": "^r128+",
    "@react-three/fiber": "^8.17+",
    "@react-three/drei": "^9.100+",
    "tailwindcss": "^4"
  },
  "devDependencies": {
    "vite": "^6",
    "@vitejs/plugin-react": "^4"
  }
}
```

### Shared (src/shared/)
```json
{
  "dependencies": {
    "typescript": "^5"
    // NO otras dependencias
  }
}
```

---

## 📊 Tipos Esenciales

```typescript
// src/shared/types/alignment.ts

export interface ReadingData {
  verticalVibration: number;      // mm/s
  horizontalVibration: number;    // mm/s
  verticalPhase: number;          // 0-360 grados
  horizontalPhase: number;        // 0-360 grados
  runoutAxial: number;            // micrones
  runoutRadial: number;           // micrones
  bearingTemperature?: number;    // °C
}

export interface AlignmentCorrection {
  id: string;
  location: 'motor' | 'pump' | 'shaft';
  direction: 'vertical' | 'horizontal' | 'axial' | 'radial';
  side: 'top' | 'bottom' | 'left' | 'right' | 'both';
  magnitude: number;              // mm/micrones
  priority: 1 | 2 | 3;           // crítico, warning, info
  description: string;
}

export interface ArrowIndicator {
  id: string;
  position: [number, number, number];   // [x, y, z]
  direction: [number, number, number];  // vector normalizado
  color: string;                        // hex
  visible: boolean;
  animated: boolean;
}

export interface EquipmentSpec {
  name: string;
  motorKW: number;
  motorRPM: number;
  pumpType: string;
  thresholds: {
    zone_a: number;
    zone_b: number;
    zone_c: number;
    zone_d: number;
  };
}
```

---

## 🧮 Flujo de Datos

```
ReadingForm.tsx
  ↓ onSubmit(ReadingData)
  ↓
useAlignmentCalculations()
  ↓
calculateCorrections(reading) [shared/lib/alignment-calc.ts]
  ↓
AlignmentCorrection[]
  ↓
ArrowIndicators.tsx (filtra por visible=true)
  ↓
Scene.tsx renderiza flechas sobre modelo
  ↓
CorrectionSteps.tsx muestra pasos ordenados
```

---

## 🎯 Puntos Clave del Modelo Blender

Asumiendo tu modelo tiene:
- Motor (izquierda)
- Bomba (derecha)
- Ejes/acoples (centro)
- Puntos de montaje identificados

**Necesario:**
1. Exportar como `.glb` (File → Export → glTF Binary)
2. Optimizar: `gltf-transform compress pump-motor-assembly.glb`
3. Guardar en: `src/assets/models/pump-motor-assembly.glb`

**Coordenadas aproximadas** (ajustar según tu modelo):
```typescript
const EQUIPMENT_POSITIONS = {
  motor: [-1.5, 0, 0],
  pump: [1.5, 0, 0],
  shaft: [0, 0, 0],
  motorFeetLeft: [-1.5, -0.8, -0.5],
  motorFeetRight: [-1.5, -0.8, 0.5],
  pumpFeetLeft: [1.5, -0.8, -0.5],
  pumpFeetRight: [1.5, -0.8, 0.5],
};
```

---

## 🚀 Setup Inicial

```bash
# 1. Crear proyecto Vite + React
bun create vite bomba-alignment-app --template react-ts

cd bomba-alignment-app

# 2. Instalar dependencias
bun add three @react-three/fiber @react-three/drei tailwindcss postcss autoprefixer

# 3. Crear estructura
mkdir -p src/{web/{pages,components/{3d,ui}},mobile/{screens,components},shared/{lib,types,hooks}}
mkdir -p src/assets/models

# 4. Configurar Tailwind
bunx tailwindcss init -p
```

---

## 🎓 Ejemplo: Cálculo de Correcciones

```typescript
// src/shared/lib/alignment-calc.ts

export function calculateCorrections(reading: ReadingData): AlignmentCorrection[] {
  const corrections: AlignmentCorrection[] = [];
  
  // Convertir fase a radianes
  const vPhaseRad = (reading.verticalPhase * Math.PI) / 180;
  const hPhaseRad = (reading.horizontalPhase * Math.PI) / 180;
  
  // Descomposición de vectores
  const vAdjustX = Math.sin(vPhaseRad) * reading.verticalVibration;
  const vAdjustY = Math.cos(vPhaseRad) * reading.verticalVibration;
  const hAdjustX = Math.sin(hPhaseRad) * reading.horizontalVibration;
  const hAdjustY = Math.cos(hPhaseRad) * reading.horizontalVibration;
  
  // Lógica de umbrales
  if (reading.verticalVibration > 11) {  // Zona D
    corrections.push({
      id: 'vertical-critical',
      location: vAdjustX > 0 ? 'pump' : 'motor',
      direction: 'vertical',
      side: vAdjustY > 0 ? 'top' : 'bottom',
      magnitude: Math.abs(reading.verticalVibration),
      priority: 1,
      description: 'Ajuste vertical CRÍTICO en ' + (vAdjustX > 0 ? 'bomba' : 'motor'),
    });
  } else if (reading.verticalVibration > 7.1) {  // Zona C
    corrections.push({
      id: 'vertical-warning',
      location: vAdjustX > 0 ? 'pump' : 'motor',
      direction: 'vertical',
      side: vAdjustY > 0 ? 'top' : 'bottom',
      magnitude: Math.abs(reading.verticalVibration),
      priority: 2,
      description: 'Ajuste vertical en ' + (vAdjustX > 0 ? 'bomba' : 'motor'),
    });
  }
  
  // Similar para horizontal, runout, etc...
  
  return corrections.sort((a, b) => a.priority - b.priority);
}
```

---

## 🎨 Ejemplo: Componente Scene

```typescript
// src/web/components/3d/Scene.tsx

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EquipmentModel } from './EquipmentModel';
import { ArrowIndicators } from './ArrowIndicators';
import type { AlignmentCorrection } from '@/shared/types/alignment';

interface SceneProps {
  corrections: AlignmentCorrection[];
}

export function Scene({ corrections }: SceneProps) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      
      <EquipmentModel />
      
      {/* Solo renderizar flechas visibles */}
      <ArrowIndicators corrections={corrections.filter(c => c.visible !== false)} />
      
      <OrbitControls enablePan enableZoom />
    </Canvas>
  );
}
```

---

## 📋 Checklist Fase 1 (Web)

- [ ] `bun create vite`
- [ ] Instalar deps (three, fiber, drei, tailwind)
- [ ] Crear estructura `src/{web,shared}`
- [ ] Copiar `pump-motor-assembly.glb` a `src/assets/models/`
- [ ] Crear `src/shared/types/alignment.ts`
- [ ] Crear `src/shared/lib/alignment-calc.ts`
- [ ] Crear `src/web/components/3d/Scene.tsx`
- [ ] Crear `src/web/components/3d/EquipmentModel.tsx`
- [ ] Crear `src/web/components/3d/ArrowIndicators.tsx`
- [ ] Crear `src/web/components/ui/ReadingForm.tsx`
- [ ] Crear `src/web/App.tsx`
- [ ] Testing en mobile (responsive)

---

## 📝 Notas Importantes

1. **Modelo Blender:** El GLB debe estar optimizado y con coordenadas claras
2. **Flechas:** Solo visibles si hay correcciones (condicional)
3. **Mobile-First:** Diseñar pensando en viewport móvil (Tailwind responsive)
4. **TypeScript Puro:** `src/shared/` sin dependencias de React
5. **Reusabilidad:** Misma lógica para Web (React) y Mobile (React Native, fase 2)

---

**Proyecto:** Bomba Alignment App
**Versión:** 2.0 (Web + Mobile ready)
**Stack:** Bun + React + Vite + Three.js + Tailwind
**Target:** Mobile-first optimization
