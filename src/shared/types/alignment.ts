// Lecturas individuales de las 4 posiciones del reloj (normalizadas a 12h=0, en µm)
export interface RunoutReadings {
  r12: number   // siempre 0 (referencia)
  r3:  number   // lectura a 90° relativa a 12h, en µm
  r6:  number   // lectura a 180° relativa a 12h, en µm
  r9:  number   // lectura a 270° relativa a 12h, en µm
}

// Datos capturados desde el formulario de lectura
export interface ReadingData {
  runoutAxial: number;          // TIR en µm
  runoutRadial: number;         // TIR en µm
  runoutAxialReadings?: RunoutReadings   // lecturas individuales para corrección direccional
  runoutRadialReadings?: RunoutReadings
}

// Las 4 patas del motor (nombradas desde el frente del equipo, mirando al acople)
export type PataLocation = 'front-left' | 'front-right' | 'back-left' | 'back-right'

// Corrección individual calculada desde una lectura
export interface AlignmentCorrection {
  id: string;
  location: PataLocation | 'shaft';  // patas = flechas 3D | shaft = solo texto
  direction: 'vertical' | 'horizontal' | 'axial';
  side: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
  magnitude: number;
  unit?: 'mm/s' | 'µm' | '°C';
  priority: 1 | 2 | 3; // 1=crítico, 2=advertencia, 3=info
  description: string;
  visible?: boolean;
}

// Indicador visual 3D para renderizar en la escena
export interface ArrowIndicator {
  id: string;
  position: [number, number, number];   // [x, y, z] en coordenadas del modelo
  direction: [number, number, number];  // vector unitario de dirección
  color: string;                        // color hex según prioridad
  visible: boolean;
  animated: boolean;                    // true solo para prioridad 1
}

// Especificaciones del equipo (para umbrales ISO adaptativos)
export interface EquipmentSpec {
  name: string;
  motorKW: number;
  motorRPM: number;
  pumpType: string;
  thresholds: {
    zone_a: number; // hasta aquí: sin restricción
    zone_b: number; // hasta aquí: operación prolongada OK
    zone_c: number; // hasta aquí: operación limitada
    zone_d: number; // sobre este: zona de daño
  };
}
