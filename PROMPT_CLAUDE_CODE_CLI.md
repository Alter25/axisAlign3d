# 🎯 Prompt para Claude Code CLI - Bomba Alignment App

## 📌 Instrucciones Principales

```
CONTEXTO: Bomba Alignment App - Sitio web React optimizado para mobile
STACK: Bun + React + Vite + TypeScript + Three.js + Tailwind CSS
FASE 1: Web (React)
FASE 2: Mobile (React Native) - reutilizar src/shared/

BASE CONTEXT: Lee CONTEXT_v2.md para toda la información del proyecto
```

---

## 🚀 Flujo de Generación

Ejecuta estos comandos EN ORDEN en Claude Code CLI:

### PASO 1: Setup Base

```bash
claude-code <<'PROMPT1'
$(cat CONTEXT_v2.md)

TAREA 1: Setup del Proyecto
- Crear estructura de carpetas: src/{web,mobile,shared}
- Generar tsconfig.json (React + TS strict)
- Generar vite.config.ts (con React plugin)
- Generar tailwind.config.js
- Generar postcss.config.js
- Generar .gitignore

NO generes archivos, solo muestra los contenidos
PROMPT1
```

### PASO 2: Tipos Compartidos

```bash
claude-code <<'PROMPT2'
$(cat CONTEXT_v2.md)

TAREA 2: Generar src/shared/types/alignment.ts
Crea todas las interfaces:
- ReadingData (entrada del usuario)
- AlignmentCorrection (correcciones calculadas)
- ArrowIndicator (flechas 3D)
- EquipmentSpec (especificaciones del equipo)

REQUERIMIENTOS:
- TypeScript strict mode
- Comentarios en español
- Exportar todas las interfaces
- NO agregar dependencias externas
PROMPT2
```

### PASO 3: Lógica de Cálculos

```bash
claude-code <<'PROMPT3'
$(cat CONTEXT_v2.md)

TAREA 3: Generar src/shared/lib/alignment-calc.ts
Implementa:
- calculateCorrections(reading: ReadingData): AlignmentCorrection[]
- Lógica de umbrales ISO 10816 (zona A, B, C, D)
- Descomposición con trigonometría (sin/cos)
- Determinación de lado (top/bottom/left/right) usando fase
- Priorización (1=crítico, 2=warning, 3=info)

EJEMPLO:
Si verticalVibration > 11:
  → priority: 1 (zona D)
  → direction: 'vertical'
  → side: determinado por fase
  
Si 7.1 < verticalVibration <= 11:
  → priority: 2 (zona C)

DETALLES:
- Convertir fase a radianes: (grados * π) / 180
- Usar Math.sin() y Math.cos()
- Incluir lógica para horizontal, runout axial, runout radial
- TypeScript puro (sin React)
PROMPT3
```

### PASO 4: Componente 3D Principal

```bash
claude-code <<'PROMPT4'
$(cat CONTEXT_v2.md)

TAREA 4: Generar src/web/components/3d/Scene.tsx
Crear componente Canvas de Three.js:

FEATURES:
- Canvas responsivo (width: 100%, height: 100%)
- Cámara perspectiva (posición: [0, 2, 5])
- Luces: ambientLight + directionalLight
- OrbitControls (pan, zoom, rotate)
- Renderizar EquipmentModel
- Renderizar ArrowIndicators (solo si visible)
- Optimizado mobile: dpr={[1, 2]}

PROPS:
interface SceneProps {
  corrections: AlignmentCorrection[];
}

NOTAS:
- Solo renderizar correcciones con visible !== false
- Usar @react-three/drei para helpers
- Responsive design
PROMPT4
```

### PASO 5: Cargar Modelo GLB

```bash
claude-code <<'PROMPT5'
$(cat CONTEXT_v2.md)

TAREA 5: Generar src/web/components/3d/EquipmentModel.tsx
Componente para cargar el modelo Blender:

FEATURES:
- useGLTF() hook (de @react-three/drei)
- Cargar 'src/assets/models/pump-motor-assembly.glb'
- Aplicar escala y rotación inicial
- Precargar el modelo para optimización

CODE:
import { useGLTF } from '@react-three/drei';

export function EquipmentModel() {
  const { scene } = useGLTF('src/assets/models/pump-motor-assembly.glb');
  
  return (
    <primitive 
      object={scene}
      scale={1.2}
      position={[0, 0, 0]}
      rotation={[0, Math.PI / 4, 0]}
    />
  );
}

useGLTF.preload('src/assets/models/pump-motor-assembly.glb');

IMPORTANTE:
- Path relativo correcto
- Preload para mejor performance
- Comments en español
PROMPT5
```

### PASO 6: Flechas de Corrección

```bash
claude-code <<'PROMPT6'
$(cat CONTEXT_v2.md)

TAREA 6: Generar src/web/components/3d/ArrowIndicators.tsx
Sistema de flechas condicionales:

FEATURES:
- Renderizar solo correcciones visibles
- Mapear cada corrección a una flecha 3D
- Colores según prioridad:
  * 1 = #ef4444 (rojo crítico)
  * 2 = #eab308 (amarillo warning)
  * 3 = #06b6d4 (cian info)
- Animación pulse para prioridad 1
- Geometría: cilindro (eje) + cono (punta)

EJEMPLO DE FLECHA:
- Posición: relativa al modelo (motor/bomba)
- Dirección: vector calculado desde corrección
- Animación: useFrame() para pulse
- Emisión de luz para visibilidad

ESTRUCTURA:
function ArrowIndicators({ corrections }) {
  return (
    <>
      {corrections.map(correction => (
        <Arrow3D key={correction.id} correction={correction} />
      ))}
    </>
  );
}

function Arrow3D({ correction }) {
  // Renderizar cilindro + cono
  // Aplicar color y animación
}

IMPORTANTE:
- Solo renderizar si correction.visible !== false
- Posiciones hardcodeadas (ajustar según tu modelo)
- useFrame() para animaciones
- Emisión de luz para efectos visuales
PROMPT6
```

### PASO 7: Formulario de Entrada

```bash
claude-code <<'PROMPT7'
$(cat CONTEXT_v2.md)

TAREA 7: Generar src/web/components/ui/ReadingForm.tsx
Formulario para capturar datos de lectura:

CAMPOS:
- Vibración vertical (mm/s): number input
- Vibración horizontal (mm/s): number input
- Fase vertical (0-360°): number input con slider
- Fase horizontal (0-360°): number input con slider
- Runout axial (micrones): number input
- Runout radial (micrones): number input
- Temperatura rodamientos (°C): number input (opcional)

FEATURES:
- Estado local con useState
- Validación básica (no negativos, rango 0-360 para fase)
- Botón "Calcular"
- Layout responsivo (Tailwind)
- Mobile-first (col-1 móvil, col responsive desktop)
- Labels en español

PROPS:
interface ReadingFormProps {
  onSubmit: (data: ReadingData) => void;
}

STYLING:
- Tailwind classes
- Inputs con borde, padding, focus states
- Botón con fondo oscuro (slate-800 o similar)
- Container con max-width en desktop
- Mobile: full width, padding

IMPORTANTE:
- Capturar ReadingData completa
- onSubmit callback con datos validados
- User-friendly (hints, placeholders)
PROMPT7
```

### PASO 8: Visualización de Pasos

```bash
claude-code <<'PROMPT8'
$(cat CONTEXT_v2.md)

TAREA 8: Generar src/web/components/ui/CorrectionSteps.tsx
Mostrar pasos de corrección ordenados:

FEATURES:
- Recibir array de AlignmentCorrection[]
- Agrupar por prioridad
- Mostrar orden: 1 (críticos) → 2 (warning) → 3 (info)
- Cada paso como tarjeta con:
  * Número de paso
  * Ubicación (motor/bomba/eje)
  * Dirección (vertical/horizontal/axial)
  * Magnitud (con unidades)
  * Descripción clara en español
  * Color según prioridad

EJEMPLO DE PASO:
┌─────────────────────────────────┐
│ PASO 1 - CRÍTICO                │
│ Motor: Ajuste Vertical          │
│ Dirección: Hacia Abajo (12.5mm) │
│ Descripción: Ajuste crítico...  │
└─────────────────────────────────┘

STYLING:
- Tarjetas con borde y sombra
- Color del borde según prioridad
- Tailwind responsive
- Mobile-friendly layout

PROPS:
interface CorrectionStepsProps {
  corrections: AlignmentCorrection[];
}

IMPORTANTE:
- Mostrar solo si hay correcciones
- Orden automático por prioridad
- Descripción clara en español
- Indicador visual de prioridad (color)
PROMPT8
```

### PASO 9: Dashboard/Layout Principal

```bash
claude-code <<'PROMPT9'
$(cat CONTEXT_v2.md)

TAREA 9: Generar src/web/components/Dashboard.tsx
Layout principal que integra todo:

FEATURES:
- Grid responsivo: mobile (1 col) → desktop (3 cols)
- Columna izquierda: ReadingForm (col-1)
- Columna derecha: Scene 3D (col-2)
- Abajo (móvil): CorrectionSteps
- Gestión de estado con useState
- Integración con calculateCorrections

FLUJO:
1. Usuario completa ReadingForm
2. onSubmit → calculateCorrections()
3. Estado actualizado con correcciones
4. ArrowIndicators se actualiza en Scene
5. CorrectionSteps muestra pasos

ESTRUCTURA:
<div className="grid grid-cols-1 lg:grid-cols-3">
  <div className="col-span-1">
    <ReadingForm onSubmit={handleSubmit} />
  </div>
  
  <div className="col-span-1 lg:col-span-2">
    <Scene corrections={corrections} />
  </div>
  
  <div className="col-span-1 lg:col-span-3">
    <CorrectionSteps corrections={corrections} />
  </div>
</div>

IMPORTANTE:
- Mobile-first responsive design
- Estado sincronizado
- Integración con calculateCorrections
- Import desde shared/lib/
PROMPT9
```

### PASO 10: App Root

```bash
claude-code <<'PROMPT10'
$(cat CONTEXT_v2.md)

TAREA 10: Generar src/web/App.tsx
Componente raíz de la aplicación:

FEATURES:
- Layout base con header (título)
- Import Dashboard
- Styling global
- Meta info (title, description)

ESTRUCTURA:
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4">
        <h1>Bomba Alignment</h1>
        <p>Visualizador 3D de correcciones de alineación</p>
      </header>
      
      <main className="container mx-auto">
        <Dashboard />
      </main>
    </div>
  );
}

IMPORTANTE:
- Header simple con título
- Responsive container
- Dark/light theme (Tailwind)
PROMPT10
```

### PASO 11: Entry Point Vite

```bash
claude-code <<'PROMPT11'
$(cat CONTEXT_v2.md)

TAREA 11: Generar src/web/main.tsx
Entry point para Vite:

CODE:
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

Y generar src/web/index.css:
@tailwind base;
@tailwind components;
@tailwind utilities;
PROMPT11
```

---

## 📝 Uso en Terminal

```bash
# Ir a la carpeta del proyecto
cd bomba-alignment-app

# Ejecutar cada PROMPT en orden
claude-code < PROMPT_PASO_1.txt
claude-code < PROMPT_PASO_2.txt
... y así sucesivamente

# O directamente en la terminal
claude-code <<'EOF'
$(cat CONTEXT_v2.md)

TAREA 2: Generar src/shared/types/alignment.ts
...
EOF
```

---

## 🎯 Comando Unificado (RECOMENDADO)

Si quieres hacerlo de una sola vez:

```bash
claude-code <<'COMPLETE'
$(cat CONTEXT_v2.md)

GENERAR TODOS LOS ARCHIVOS:

PASO 1: src/shared/types/alignment.ts
- ReadingData interface
- AlignmentCorrection interface
- ArrowIndicator interface
- EquipmentSpec interface

PASO 2: src/shared/lib/alignment-calc.ts
- calculateCorrections() function
- Lógica ISO 10816
- Trigonometría (sin/cos)
- Priorización

PASO 3: src/web/components/3d/Scene.tsx
- Canvas Three.js
- Camera, lights, controls

PASO 4: src/web/components/3d/EquipmentModel.tsx
- useGLTF hook
- Load pump-motor-assembly.glb

PASO 5: src/web/components/3d/ArrowIndicators.tsx
- Flechas 3D condicionales
- Colores por prioridad
- Animaciones

PASO 6: src/web/components/ui/ReadingForm.tsx
- Formulario de entrada
- Validación
- onSubmit callback

PASO 7: src/web/components/ui/CorrectionSteps.tsx
- Visualización de pasos
- Ordenados por prioridad

PASO 8: src/web/components/Dashboard.tsx
- Layout responsivo
- Integración de componentes

PASO 9: src/web/App.tsx
- Root component
- Header

PASO 10: src/web/main.tsx + src/web/index.css
- Vite entry point
- Tailwind imports

PASO 11: vite.config.ts
- React plugin
- Alias @/

PASO 12: tsconfig.json
- TS strict mode
- Path alias

PASO 13: tailwind.config.js
- Configuración base

PASO 14: postcss.config.js
- Tailwind processing

NO GENERES ARCHIVOS FÍSICOS
Solo muestra el contenido completo de cada archivo con formato markdown code blocks
COMPLETE
```

---

## ✅ Checklist Post-Generación

- [ ] Copiar contenidos a carpeta correcta
- [ ] Copiar `pump-motor-assembly.glb` a `src/assets/models/`
- [ ] Ejecutar `bun install`
- [ ] Ajustar rutas si es necesario
- [ ] `bun run dev` para probar
- [ ] Verificar responsive en mobile
- [ ] Ajustar posiciones de flechas según tu modelo
- [ ] Verificar colores y animaciones

---

## 📞 Notas Importantes

1. **Rutas:** Las rutas asumen estructura exacta (`src/web/`, `src/shared/`)
2. **Modelo 3D:** Ajustar posiciones de flechas según coordenadas de tu modelo Blender
3. **Responsive:** Tailwind ya incluye mobile-first, pero verificar en dispositivo real
4. **TypeScript:** Usar strict mode, agregar tipos a todo
5. **Performance:** dpr={[1, 2]} + preload GLB optimiza mobile

---

**Fecha:** Junio 2026
**Usuario:** Jorge
**Stack:** Bun + React + Vite + Three.js + Tailwind
**Objetivo:** Web optimizado mobile + React Native (fase 2)
