export type EstadoLicitacion = 'publicada' | 'adjudicada' | 'desierta';

export interface Licitacion {
  id: string;
  nombre: string;
  organismo: string;
  region: string;
  categoria: string;
  estado: EstadoLicitacion;
  monto: number;
  fechaPublicacion: string; // YYYY-MM-DD
  fechaCierre: string;
}

export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
] as const;

export const CATEGORIAS = [
  'Tecnología y Telecomunicaciones',
  'Construcción y Obras Civiles',
  'Salud y Equipamiento Médico',
  'Servicios Profesionales',
  'Alimentación y Catering',
  'Transporte y Logística',
  'Educación y Capacitación',
  'Seguridad y Vigilancia',
  'Mantención y Aseo',
  'Equipamiento y Mobiliario',
] as const;

export const licitaciones: Licitacion[] = [
  { id: 'L-2024-001', nombre: 'Adquisición de equipos computacionales para hospitales', organismo: 'Hospital San Borja Arriarán', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'adjudicada', monto: 84500000, fechaPublicacion: '2024-01-08', fechaCierre: '2024-01-28' },
  { id: 'L-2024-002', nombre: 'Servicio de mantención de áreas verdes y jardines', organismo: 'Municipalidad de Providencia', region: 'Metropolitana', categoria: 'Mantención y Aseo', estado: 'adjudicada', monto: 22000000, fechaPublicacion: '2024-01-12', fechaCierre: '2024-02-01' },
  { id: 'L-2024-003', nombre: 'Construcción de sede vecinal sector norte', organismo: 'Municipalidad de Antofagasta', region: 'Antofagasta', categoria: 'Construcción y Obras Civiles', estado: 'adjudicada', monto: 135000000, fechaPublicacion: '2024-01-20', fechaCierre: '2024-02-15' },
  { id: 'L-2024-004', nombre: 'Servicio de alimentación casino institucional', organismo: 'SENAME Región de Valparaíso', region: 'Valparaíso', categoria: 'Alimentación y Catering', estado: 'desierta', monto: 48000000, fechaPublicacion: '2024-02-03', fechaCierre: '2024-02-20' },
  { id: 'L-2024-005', nombre: 'Consultoría en transformación digital', organismo: 'CORFO', region: 'Metropolitana', categoria: 'Servicios Profesionales', estado: 'adjudicada', monto: 61000000, fechaPublicacion: '2024-02-10', fechaCierre: '2024-03-01' },
  { id: 'L-2024-006', nombre: 'Adquisición de ambulancias equipadas', organismo: 'SAMU Biobío', region: 'Biobío', categoria: 'Salud y Equipamiento Médico', estado: 'adjudicada', monto: 290000000, fechaPublicacion: '2024-02-14', fechaCierre: '2024-03-10' },
  { id: 'L-2024-007', nombre: 'Servicio de seguridad y vigilancia edificio central', organismo: 'Ministerio de Hacienda', region: 'Metropolitana', categoria: 'Seguridad y Vigilancia', estado: 'adjudicada', monto: 37500000, fechaPublicacion: '2024-02-22', fechaCierre: '2024-03-12' },
  { id: 'L-2024-008', nombre: 'Capacitación en habilidades digitales para funcionarios', organismo: 'Municipalidad de Temuco', region: 'La Araucanía', categoria: 'Educación y Capacitación', estado: 'desierta', monto: 15000000, fechaPublicacion: '2024-03-05', fechaCierre: '2024-03-22' },
  { id: 'L-2024-009', nombre: 'Reposición de mobiliario oficinas regionales', organismo: 'SEREMI Salud Coquimbo', region: 'Coquimbo', categoria: 'Equipamiento y Mobiliario', estado: 'adjudicada', monto: 19800000, fechaPublicacion: '2024-03-11', fechaCierre: '2024-03-28' },
  { id: 'L-2024-010', nombre: 'Transporte de pacientes crónicos zona rural', organismo: 'Hospital Regional de Iquique', region: 'Tarapacá', categoria: 'Transporte y Logística', estado: 'adjudicada', monto: 52000000, fechaPublicacion: '2024-03-18', fechaCierre: '2024-04-05' },
  { id: 'L-2024-011', nombre: 'Software de gestión tributaria municipal', organismo: 'Municipalidad de Rancagua', region: 'O\'Higgins', categoria: 'Tecnología y Telecomunicaciones', estado: 'desierta', monto: 43000000, fechaPublicacion: '2024-04-02', fechaCierre: '2024-04-20' },
  { id: 'L-2024-012', nombre: 'Pavimentación calle Los Aromos tramo 2', organismo: 'Municipalidad de Chillán', region: 'Ñuble', categoria: 'Construcción y Obras Civiles', estado: 'adjudicada', monto: 178000000, fechaPublicacion: '2024-04-09', fechaCierre: '2024-04-30' },
  { id: 'L-2024-013', nombre: 'Insumos médicos UCI adulto 2024', organismo: 'Hospital Guillermo Grant Benavente', region: 'Biobío', categoria: 'Salud y Equipamiento Médico', estado: 'adjudicada', monto: 220000000, fechaPublicacion: '2024-04-15', fechaCierre: '2024-05-05' },
  { id: 'L-2024-014', nombre: 'Servicio de aseo y limpieza dependencias municipales', organismo: 'Municipalidad de Valdivia', region: 'Los Ríos', categoria: 'Mantención y Aseo', estado: 'adjudicada', monto: 28000000, fechaPublicacion: '2024-04-22', fechaCierre: '2024-05-12' },
  { id: 'L-2024-015', nombre: 'Estudio de impacto vial sector Pudahuel Norte', organismo: 'Municipalidad de Pudahuel', region: 'Metropolitana', categoria: 'Servicios Profesionales', estado: 'adjudicada', monto: 34000000, fechaPublicacion: '2024-05-06', fechaCierre: '2024-05-24' },
  { id: 'L-2024-016', nombre: 'Adquisición tablets educativas establecimientos municipales', organismo: 'DAEM Valparaíso', region: 'Valparaíso', categoria: 'Educación y Capacitación', estado: 'adjudicada', monto: 67000000, fechaPublicacion: '2024-05-13', fechaCierre: '2024-05-30' },
  { id: 'L-2024-017', nombre: 'Servicio de vigilancia nocturna bodega fiscal', organismo: 'DGAC Antofagasta', region: 'Antofagasta', categoria: 'Seguridad y Vigilancia', estado: 'desierta', monto: 18500000, fechaPublicacion: '2024-05-20', fechaCierre: '2024-06-06' },
  { id: 'L-2024-018', nombre: 'Flota vehículos livianos para inspección territorial', organismo: 'SAG Los Lagos', region: 'Los Lagos', categoria: 'Transporte y Logística', estado: 'adjudicada', monto: 95000000, fechaPublicacion: '2024-06-03', fechaCierre: '2024-06-21' },
  { id: 'L-2024-019', nombre: 'Plataforma de participación ciudadana online', organismo: 'SUBDERE', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'adjudicada', monto: 78000000, fechaPublicacion: '2024-06-10', fechaCierre: '2024-06-28' },
  { id: 'L-2024-020', nombre: 'Construcción colector aguas lluvias Avenida Central', organismo: 'MOP Maule', region: 'Maule', categoria: 'Construcción y Obras Civiles', estado: 'adjudicada', monto: 410000000, fechaPublicacion: '2024-06-17', fechaCierre: '2024-07-08' },
  { id: 'L-2024-021', nombre: 'Raciones alimentarias programa adulto mayor', organismo: 'SENAMA Metropolitana', region: 'Metropolitana', categoria: 'Alimentación y Catering', estado: 'adjudicada', monto: 55000000, fechaPublicacion: '2024-07-01', fechaCierre: '2024-07-19' },
  { id: 'L-2024-022', nombre: 'Equipamiento laboratorio clínico regional', organismo: 'Hospital Regional de Arica', region: 'Arica y Parinacota', categoria: 'Salud y Equipamiento Médico', estado: 'desierta', monto: 130000000, fechaPublicacion: '2024-07-08', fechaCierre: '2024-07-26' },
  { id: 'L-2024-023', nombre: 'Sillas y escritorios oficina atención ciudadana', organismo: 'Registro Civil Atacama', region: 'Atacama', categoria: 'Equipamiento y Mobiliario', estado: 'adjudicada', monto: 12000000, fechaPublicacion: '2024-07-15', fechaCierre: '2024-08-02' },
  { id: 'L-2024-024', nombre: 'Consultoría rediseño organizacional', organismo: 'Municipalidad de Puerto Montt', region: 'Los Lagos', categoria: 'Servicios Profesionales', estado: 'adjudicada', monto: 41000000, fechaPublicacion: '2024-07-22', fechaCierre: '2024-08-09' },
  { id: 'L-2024-025', nombre: 'Servicio de limpieza industrial planta desalación', organismo: 'ESSAT Tarapacá', region: 'Tarapacá', categoria: 'Mantención y Aseo', estado: 'adjudicada', monto: 32000000, fechaPublicacion: '2024-08-05', fechaCierre: '2024-08-23' },
  { id: 'L-2024-026', nombre: 'Sistema de cámaras IP edificio gubernamental', organismo: 'Intendencia Coquimbo', region: 'Coquimbo', categoria: 'Seguridad y Vigilancia', estado: 'adjudicada', monto: 26000000, fechaPublicacion: '2024-08-12', fechaCierre: '2024-08-30' },
  { id: 'L-2024-027', nombre: 'Traslado logístico materiales electorales', organismo: 'SERVEL Biobío', region: 'Biobío', categoria: 'Transporte y Logística', estado: 'adjudicada', monto: 19000000, fechaPublicacion: '2024-08-19', fechaCierre: '2024-09-06' },
  { id: 'L-2024-028', nombre: 'Desarrollo aplicación móvil trámites municipales', organismo: 'Municipalidad de Las Condes', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'adjudicada', monto: 112000000, fechaPublicacion: '2024-09-02', fechaCierre: '2024-09-20' },
  { id: 'L-2024-029', nombre: 'Mejoramiento calzada camino rural sector Laja', organismo: 'Municipalidad de Nacimiento', region: 'Biobío', categoria: 'Construcción y Obras Civiles', estado: 'desierta', monto: 88000000, fechaPublicacion: '2024-09-09', fechaCierre: '2024-09-27' },
  { id: 'L-2024-030', nombre: 'Medicamentos e insumos para CESFAM zona sur', organismo: 'Municipalidad de La Pintana', region: 'Metropolitana', categoria: 'Salud y Equipamiento Médico', estado: 'adjudicada', monto: 75000000, fechaPublicacion: '2024-09-16', fechaCierre: '2024-10-04' },
  { id: 'L-2024-031', nombre: 'Asistencia técnica programa emprendimiento juvenil', organismo: 'INJUV La Araucanía', region: 'La Araucanía', categoria: 'Servicios Profesionales', estado: 'adjudicada', monto: 23000000, fechaPublicacion: '2024-10-07', fechaCierre: '2024-10-25' },
  { id: 'L-2024-032', nombre: 'Sillas auditorium centro cultural municipal', organismo: 'Municipalidad de Aysén', region: 'Aysén', categoria: 'Equipamiento y Mobiliario', estado: 'desierta', monto: 8500000, fechaPublicacion: '2024-10-14', fechaCierre: '2024-11-01' },
  { id: 'L-2024-033', nombre: 'Raciones alimentarias establecimientos educacionales', organismo: 'JUNAEB Valparaíso', region: 'Valparaíso', categoria: 'Alimentación y Catering', estado: 'adjudicada', monto: 145000000, fechaPublicacion: '2024-10-21', fechaCierre: '2024-11-08' },
  { id: 'L-2024-034', nombre: 'Mantenimiento preventivo ascensores edificios públicos', organismo: 'MBN Maule', region: 'Maule', categoria: 'Mantención y Aseo', estado: 'adjudicada', monto: 14500000, fechaPublicacion: '2024-11-04', fechaCierre: '2024-11-22' },
  { id: 'L-2024-035', nombre: 'Servicio de guardia seguridad sede regional', organismo: 'SEREMI Educación Ñuble', region: 'Ñuble', categoria: 'Seguridad y Vigilancia', estado: 'adjudicada', monto: 21000000, fechaPublicacion: '2024-11-11', fechaCierre: '2024-11-29' },
  { id: 'L-2024-036', nombre: 'Transporte escolar comunidades rurales', organismo: 'Municipalidad de Punta Arenas', region: 'Magallanes', categoria: 'Transporte y Logística', estado: 'adjudicada', monto: 63000000, fechaPublicacion: '2024-11-18', fechaCierre: '2024-12-06' },
  { id: 'L-2024-037', nombre: 'Actualización infraestructura servidores datacenter', organismo: 'IPS', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'publicada', monto: 195000000, fechaPublicacion: '2024-12-02', fechaCierre: '2025-01-10' },
  { id: 'L-2024-038', nombre: 'Habilitación posta rural sector cordillera', organismo: 'SEREMI Salud O\'Higgins', region: 'O\'Higgins', categoria: 'Construcción y Obras Civiles', estado: 'adjudicada', monto: 240000000, fechaPublicacion: '2024-12-09', fechaCierre: '2025-01-17' },
  { id: 'L-2024-039', nombre: 'Insumos odontológicos red asistencial norte', organismo: 'Servicio de Salud Atacama', region: 'Atacama', categoria: 'Salud y Equipamiento Médico', estado: 'publicada', monto: 38000000, fechaPublicacion: '2024-12-16', fechaCierre: '2025-01-20' },
  { id: 'L-2024-040', nombre: 'Diplomado gestión pública para directivos', organismo: 'SUBDERE', region: 'Metropolitana', categoria: 'Educación y Capacitación', estado: 'publicada', monto: 29000000, fechaPublicacion: '2024-12-23', fechaCierre: '2025-01-30' },
  { id: 'L-2025-001', nombre: 'Plataforma BI análisis datos salud pública', organismo: 'MINSAL', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'publicada', monto: 320000000, fechaPublicacion: '2025-01-06', fechaCierre: '2025-02-07' },
  { id: 'L-2025-002', nombre: 'Remodelación salas de espera consultorios', organismo: 'Municipalidad de La Florida', region: 'Metropolitana', categoria: 'Construcción y Obras Civiles', estado: 'adjudicada', monto: 56000000, fechaPublicacion: '2025-01-13', fechaCierre: '2025-01-31' },
  { id: 'L-2025-003', nombre: 'Adquisición ventiladores mecánicos UTI', organismo: 'Hospital Félix Bulnes', region: 'Metropolitana', categoria: 'Salud y Equipamiento Médico', estado: 'adjudicada', monto: 185000000, fechaPublicacion: '2025-01-20', fechaCierre: '2025-02-07' },
  { id: 'L-2025-004', nombre: 'Casino central edificio municipal', organismo: 'Municipalidad de Viña del Mar', region: 'Valparaíso', categoria: 'Alimentación y Catering', estado: 'publicada', monto: 72000000, fechaPublicacion: '2025-02-03', fechaCierre: '2025-02-28' },
  { id: 'L-2025-005', nombre: 'Asesoría jurídica contratos licitación pública', organismo: 'Municipalidad de Concepción', region: 'Biobío', categoria: 'Servicios Profesionales', estado: 'adjudicada', monto: 18000000, fechaPublicacion: '2025-02-10', fechaCierre: '2025-02-28' },
  { id: 'L-2025-006', nombre: 'Reposición sistema alumbrado público LED', organismo: 'Municipalidad de Calama', region: 'Antofagasta', categoria: 'Construcción y Obras Civiles', estado: 'publicada', monto: 167000000, fechaPublicacion: '2025-02-17', fechaCierre: '2025-03-14' },
  { id: 'L-2025-007', nombre: 'Mobiliario ergonómico plan teletrabajo', organismo: 'SII', region: 'Metropolitana', categoria: 'Equipamiento y Mobiliario', estado: 'adjudicada', monto: 44000000, fechaPublicacion: '2025-02-24', fechaCierre: '2025-03-14' },
  { id: 'L-2025-008', nombre: 'Servicio limpieza especializada zona franca', organismo: 'ZOFRI', region: 'Tarapacá', categoria: 'Mantención y Aseo', estado: 'publicada', monto: 35000000, fechaPublicacion: '2025-03-03', fechaCierre: '2025-03-21' },
  { id: 'L-2025-009', nombre: 'Cámaras CCTV red de parques metropolitanos', organismo: 'CONAF Metropolitana', region: 'Metropolitana', categoria: 'Seguridad y Vigilancia', estado: 'publicada', monto: 49000000, fechaPublicacion: '2025-03-10', fechaCierre: '2025-03-28' },
  { id: 'L-2025-010', nombre: 'Transporte público especial adultos mayores', organismo: 'SENAMA Los Lagos', region: 'Los Lagos', categoria: 'Transporte y Logística', estado: 'publicada', monto: 41000000, fechaPublicacion: '2025-03-17', fechaCierre: '2025-04-04' },
  { id: 'L-2025-011', nombre: 'Desarrollo portal transparencia activa', organismo: 'CPLT', region: 'Metropolitana', categoria: 'Tecnología y Telecomunicaciones', estado: 'publicada', monto: 88000000, fechaPublicacion: '2025-04-01', fechaCierre: '2025-04-25' },
  { id: 'L-2025-012', nombre: 'Ampliación cuartel bomberos Coyhaique', organismo: 'Municipalidad de Coyhaique', region: 'Aysén', categoria: 'Construcción y Obras Civiles', estado: 'publicada', monto: 295000000, fechaPublicacion: '2025-04-07', fechaCierre: '2025-05-02' },
];

export interface TendenciaMensual {
  mes: string;
  cantidad: number;
  monto: number;
}

export function calcularTendencia(data: Licitacion[]): TendenciaMensual[] {
  const map: Record<string, { cantidad: number; monto: number }> = {};
  for (const l of data) {
    const key = l.fechaPublicacion.slice(0, 7); // YYYY-MM
    if (!map[key]) map[key] = { cantidad: 0, monto: 0 };
    map[key].cantidad += 1;
    map[key].monto += l.monto;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      cantidad: v.cantidad,
      monto: Math.round(v.monto / 1_000_000),
    }));
}
