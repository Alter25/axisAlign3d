# 🚀 Quick Start - Bomba Alignment App

## 📦 Archivos Generados

```
CONTEXT_v2.md                  ← Contexto completo del proyecto
PROMPT_CLAUDE_CODE_CLI.md      ← Instrucciones para Claude Code CLI
QUICK_START.md                 ← Este archivo
```

---

## ⚡ TL;DR - Uso Rápido

### Opción A: Generación Completa (RECOMENDADO)

```bash
# 1. Copiar archivos a tu proyecto
cp CONTEXT_v2.md ~/proyectos/bomba-alignment-app/
cp PROMPT_CLAUDE_CODE_CLI.md ~/proyectos/bomba-alignment-app/

# 2. Ir a la carpeta
cd ~/proyectos/bomba-alignment-app

# 3. Ejecutar Claude Code CLI con el prompt unificado
claude-code <<'COMPLETE'
$(cat CONTEXT_v2.md)

GENERAR TODOS LOS ARCHIVOS:
1. src/shared/types/alignment.ts
2. src/shared/lib/alignment-calc.ts
3. src/web/components/3d/Scene.tsx
4. src/web/components/3d/EquipmentModel.tsx
5. src/web/components/3d/ArrowIndicators.tsx
6. src/web/components/ui/ReadingForm.tsx
7. src/web/components/ui/CorrectionSteps.tsx
8. src/web/components/Dashboard.tsx
9. src/web/App.tsx
10. src/web/main.tsx + src/web/index.css
11. vite.config.ts
12. tsconfig.json
13. tailwind.config.js
14. postcss.config.js

Muestra solo el contenido en markdown code blocks
COMPLETE
```

### Opción B: Generación Paso a Paso

```bash
# Ver PROMPT_CLAUDE_CODE_CLI.md para instrucciones detalladas
# Ejecutar cada PROMPT1, PROMPT2, etc. en orden
```

---

## 🎯 Stack Final

```
✅ Bun (package manager)
✅ React 19+ (web framework)
✅ Vite (build tool)
✅ TypeScript (strict mode)
✅ Three.js + @react-three/fiber (3D)
✅ Tailwind CSS v4 (styling)
✅ Mobile-first responsive design
```

---

## 📁 Estructura Post-Generación

```
bomba-alignment-app/
├── src/
│   ├── web/
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   ├── Scene.tsx
│   │   │   │   ├── EquipmentModel.tsx
│   │   │   │   └── ArrowIndicators.tsx
│   │   │   └── ui/
│   │   │       ├── ReadingForm.tsx
│   │   │       └── CorrectionSteps.tsx
│   │   ├── Dashboard.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── shared/
│   │   ├── types/
│   │   │   └── alignment.ts
│   │   └── lib/
│   │       └── alignment-calc.ts
│   └── assets/
│       └── models/
│           └── pump-motor-assembly.glb
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🛠️ Setup Antes de Generar

```bash
# 1. Crear proyecto Vite
bun create vite bomba-alignment-app --template react-ts
cd bomba-alignment-app

# 2. Instalar dependencias
bun add three @react-three/fiber @react-three/drei tailwindcss postcss autoprefixer

# 3. Crear estructura de carpetas
mkdir -p src/{web/{components/{3d,ui}},mobile/{screens,components},shared/{lib,types,hooks}}
mkdir -p src/assets/models

# 4. Copiar contextos y prompts
cp CONTEXT_v2.md .
cp PROMPT_CLAUDE_CODE_CLI.md .

# 5. Copiar modelo Blender
cp ~/tu-modelo/pump-motor-assembly.glb src/assets/models/
```

---

## 🎨 Flujo de Datos

```
Usuario llena ReadingForm
    ↓
onSubmit(ReadingData)
    ↓
calculateCorrections() [shared/lib]
    ↓
AlignmentCorrection[]
    ↓
Scene.tsx recibe corrections
    ↓
ArrowIndicators renderiza flechas (solo visibles)
    ↓
CorrectionSteps muestra pasos ordenados
```

---

## 🎯 Puntos Clave

### 1. Modelo 3D Blender
- ✅ Exportar como `.glb` (glTF Binary)
- ✅ Incluye: motor, bomba, ejes, acoples
- ✅ Guardar en: `src/assets/models/pump-motor-assembly.glb`
- ✅ Optimizar después: `gltf-transform compress pump-motor-assembly.glb`

### 2. Flechas Condicionales
- ✅ Solo se muestran si hay correcciones
- ✅ Colores: rojo (crítico), amarillo (warning), cian (info)
- ✅ Animación: solo prioridad 1
- ✅ Posiciones: relativas al modelo (ajustar según tu Blender)

### 3. Responsive Mobile
- ✅ Tailwind mobile-first
- ✅ Canvas: dpr={[1, 2]} para optimización
- ✅ Layout: 1 col móvil → 3 cols desktop
- ✅ Inputs con validación

### 4. TypeScript Puro
- ✅ `src/shared/` sin dependencias de React
- ✅ Reutilizable para Mobile (React Native)
- ✅ Tipos en `src/shared/types/`
- ✅ Lógica en `src/shared/lib/`

---

## 🚀 Después de Generar

```bash
# 1. Instalar dependencias finales
bun install

# 2. Iniciar servidor dev
bun run dev

# 3. Abrir en navegador
# http://localhost:5173

# 4. Verificar en mobile (responsive)
# F12 → Device toggle → Mobile

# 5. Ajustar posiciones de flechas
# Editar EQUIPMENT_POSITIONS en ArrowIndicators.tsx
# Según coordenadas de tu modelo Blender
```

---

## ⚙️ Configuraciones a Revisar

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 📱 Testing Mobile

```bash
# 1. Servir localmente
bun run dev

# 2. Abrir URL local en móvil
# https://192.168.X.X:5173

# 3. Verificar:
# - Formulario responsive
# - Canvas 3D renderiza
# - Flechas visibles
# - Scroll y zoom funcionan

# 4. DevTools móvil
# - Chrome Remote Debugging
# - Safari Web Inspector (iOS)
```

---

## 🐛 Troubleshooting

### Canvas no renderiza
```
→ Verificar que pump-motor-assembly.glb existe
→ Verificar ruta en EquipmentModel.tsx
→ Revisar console (F12) para errores
```

### Flechas no aparecen
```
→ Verificar que corrections array no esté vacío
→ Verificar coordenadas en EQUIPMENT_POSITIONS
→ Cambiar visibilidad: ArrowIndicators renderiza solo si visible !== false
```

### Rendimiento bajo en mobile
```
→ Reducir dpr: dpr={[1, 1]}
→ Comprimir GLB con gltf-transform
→ Desactivar auto-rotate en mobile
```

### TypeScript errors
```
→ Verificar imports desde @/shared/types
→ Asegurar tipos en ReadingData
→ Revisar tipos de props en componentes
```

---

## 📞 Comandos Útiles

```bash
# Dev server
bun run dev

# Build
bun run build

# Preview build
bun run preview

# Linter (si instalas ESLint)
bun run lint

# Format (si instalas Prettier)
bun run format
```

---

## 🎓 Ejemplo de Uso

### 1. Usuario abre la app
- Ve formulario de entrada (izquierda)
- Ve modelo 3D vacío (derecha)

### 2. Usuario ingresa datos
```
Vibración vertical: 12.5 mm/s
Fase vertical: 45°
Vibración horizontal: 3.2 mm/s
Fase horizontal: 180°
...
```

### 3. Usuario presiona "Calcular"
- calculateCorrections() ejecuta
- Genera correcciones (priorities 1, 2, 3)

### 4. UI actualiza
- Flechas aparecen en modelo 3D
- CorrectionSteps muestra pasos

### 5. Resultado
```
PASO 1 - CRÍTICO
Motor: Ajuste Vertical
Dirección: Hacia Abajo (12.5 mm)

PASO 2 - ADVERTENCIA
Bomba: Ajuste Horizontal
Dirección: Hacia Derecha (3.2 mm)
```

---

## 🎯 Fase 2: React Native

Cuando tengas lista la web, reutiliza:
- `src/shared/types/alignment.ts` → iOS + Android
- `src/shared/lib/alignment-calc.ts` → iOS + Android
- Crea `src/mobile/` con componentes React Native

```bash
# Setup Expo (phase 2)
bun create expo-app bomba-alignment-mobile
bun add react-native-three (o expo-three)

# Copiar shared/
cp -r src/shared src/mobile/
```

---

## ✨ Personalización

### Colores
Editar en `ArrowIndicators.tsx`:
```typescript
const colorMap = {
  1: '#ef4444',  // rojo crítico
  2: '#eab308',  // amarillo warning
  3: '#06b6d4',  // cian info
};
```

### Umbrales ISO
Editar en `shared/lib/alignment-calc.ts`:
```typescript
if (reading.verticalVibration > 11) {     // zona D
  // ...
} else if (reading.verticalVibration > 7.1) {  // zona C
  // ...
}
```

### Posiciones de Flechas
Editar en `ArrowIndicators.tsx`:
```typescript
const EQUIPMENT_POSITIONS = {
  motor: [-1.5, 0, 0],
  pump: [1.5, 0, 0],
  // Ajustar según tu modelo Blender
};
```

---

## 📚 Documentación Útil

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/)
- [Three.js Manual](https://threejs.org/manual/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

---

## 🎉 ¡Listo!

Con esto tienes todo lo necesario para generar tu app con Claude Code CLI.

**Próximos pasos:**
1. Prepara tu modelo `.glb` de Blender
2. Copia `CONTEXT_v2.md` y `PROMPT_CLAUDE_CODE_CLI.md`
3. Ejecuta el comando de Claude Code CLI
4. Ajusta posiciones y colores según necesites
5. ¡Disfruta tu app de alineación! 🎯

---

**Jorge, esto está listo para pasarlo a Claude Code CLI. ¿Confirmas que comencemos con la generación?**
