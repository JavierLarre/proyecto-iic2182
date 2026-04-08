export interface OrdenCompra {
  id: string;
  proveedor: string;
  rut: string;
  organismo: string;
  municipalidad: string;
  region: string;
  rubro: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  descripcion: string;
}

export const MUNICIPALIDADES = [
  'Municipalidad de Santiago',
  'Municipalidad de Providencia',
  'Municipalidad de Las Condes',
  'Municipalidad de Maipú',
  'Municipalidad de La Florida',
  'Municipalidad de Puente Alto',
  'Municipalidad de Concepción',
  'Municipalidad de Viña del Mar',
  'Municipalidad de Temuco',
  'Municipalidad de Antofagasta',
] as const;

export const ordenes: OrdenCompra[] = [
  // Santiago
  { id: 'OC-2024-0001', proveedor: 'Constructora Andina SpA', rut: '76.123.456-7', organismo: 'DIDECO', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Construcción', monto: 142500000, fecha: '2024-01-15', descripcion: 'Remodelación Plaza de Armas sector norte' },
  { id: 'OC-2024-0002', proveedor: 'DataSystems Chile Ltda.', rut: '77.234.567-8', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Tecnología', monto: 68400000, fecha: '2024-01-22', descripcion: 'Implementación sistema gestión documental' },
  { id: 'OC-2024-0003', proveedor: 'Aseo Total S.A.', rut: '78.345.678-9', organismo: 'Dirección de Aseo y Ornato', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Servicios', monto: 95000000, fecha: '2024-02-03', descripcion: 'Servicio de limpieza vías públicas Q1 2024' },
  { id: 'OC-2024-0004', proveedor: 'Constructora Andina SpA', rut: '76.123.456-7', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Construcción', monto: 210000000, fecha: '2024-02-18', descripcion: 'Pavimentación Av. Matta tramo 1' },
  { id: 'OC-2024-0005', proveedor: 'Seguridad Integral Ltda.', rut: '79.456.789-0', organismo: 'DIDECO', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Seguridad', monto: 38200000, fecha: '2024-03-05', descripcion: 'Guardias seguridad dependencias municipales' },
  { id: 'OC-2024-0006', proveedor: 'Constructora Andina SpA', rut: '76.123.456-7', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Construcción', monto: 185000000, fecha: '2024-03-20', descripcion: 'Habilitación multicanchas sector sur' },
  { id: 'OC-2024-0007', proveedor: 'CateringPro Chile S.A.', rut: '80.567.890-1', organismo: 'DAEM Santiago', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Alimentación', monto: 124000000, fecha: '2024-04-01', descripcion: 'Raciones escolares establecimientos municipales 2024' },
  { id: 'OC-2024-0008', proveedor: 'DataSystems Chile Ltda.', rut: '77.234.567-8', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Tecnología', monto: 42000000, fecha: '2024-04-15', descripcion: 'Mantención infraestructura TI datacenter' },
  { id: 'OC-2024-0009', proveedor: 'Transportes Céntrico SpA', rut: '81.678.901-2', organismo: 'DIDECO', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Transporte', monto: 29500000, fecha: '2024-05-02', descripcion: 'Movilización adultos mayores programa social' },
  { id: 'OC-2024-0010', proveedor: 'Aseo Total S.A.', rut: '78.345.678-9', organismo: 'Dirección de Aseo y Ornato', municipalidad: 'Municipalidad de Santiago', region: 'Metropolitana', rubro: 'Servicios', monto: 95000000, fecha: '2024-05-10', descripcion: 'Servicio de limpieza vías públicas Q2 2024' },
  // Providencia
  { id: 'OC-2024-0011', proveedor: 'Jardines del Valle SpA', rut: '82.789.012-3', organismo: 'Dir. de Gestión Ambiental', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Mantención', monto: 58000000, fecha: '2024-01-10', descripcion: 'Mantención áreas verdes y jardines comunales' },
  { id: 'OC-2024-0012', proveedor: 'Smart Cities Tech S.A.', rut: '83.890.123-4', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Tecnología', monto: 134000000, fecha: '2024-01-25', descripcion: 'Sistema semáforos inteligentes Av. Providencia' },
  { id: 'OC-2024-0013', proveedor: 'Constructora Bellavista Ltda.', rut: '84.901.234-5', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Construcción', monto: 97500000, fecha: '2024-02-12', descripcion: 'Remodelación Parque Inés de Suárez' },
  { id: 'OC-2024-0014', proveedor: 'Smart Cities Tech S.A.', rut: '83.890.123-4', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Tecnología', monto: 76000000, fecha: '2024-03-08', descripcion: 'Plataforma de atención ciudadana digital' },
  { id: 'OC-2024-0015', proveedor: 'Jardines del Valle SpA', rut: '82.789.012-3', organismo: 'Dir. de Gestión Ambiental', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Mantención', monto: 58000000, fecha: '2024-04-05', descripcion: 'Mantención áreas verdes Q2 2024' },
  { id: 'OC-2024-0016', proveedor: 'Eventos Corporativos Sur Ltda.', rut: '85.012.345-6', organismo: 'Secretaría de Comunicaciones', municipalidad: 'Municipalidad de Providencia', region: 'Metropolitana', rubro: 'Servicios', monto: 22000000, fecha: '2024-04-22', descripcion: 'Organización Feria Costumbrista 2024' },
  // Las Condes
  { id: 'OC-2024-0017', proveedor: 'InfraTech SpA', rut: '86.123.456-7', organismo: 'Dirección de Tránsito', municipalidad: 'Municipalidad de Las Condes', region: 'Metropolitana', rubro: 'Tecnología', monto: 245000000, fecha: '2024-01-18', descripcion: 'Renovación sistema de cámaras de tráfico' },
  { id: 'OC-2024-0018', proveedor: 'Constructora Premium S.A.', rut: '87.234.567-8', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Las Condes', region: 'Metropolitana', rubro: 'Construcción', monto: 380000000, fecha: '2024-02-05', descripcion: 'Construcción Centro Comunitario Las Flores' },
  { id: 'OC-2024-0019', proveedor: 'InfraTech SpA', rut: '86.123.456-7', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Las Condes', region: 'Metropolitana', rubro: 'Tecnología', monto: 112000000, fecha: '2024-03-12', descripcion: 'App móvil trámites municipales v2.0' },
  { id: 'OC-2024-0020', proveedor: 'Seguridad Las Condes Ltda.', rut: '88.345.678-9', organismo: 'Dir. de Seguridad Ciudadana', municipalidad: 'Municipalidad de Las Condes', region: 'Metropolitana', rubro: 'Seguridad', monto: 67000000, fecha: '2024-04-01', descripcion: 'Servicio vigilancia zonas residenciales 2024' },
  { id: 'OC-2024-0021', proveedor: 'Constructora Premium S.A.', rut: '87.234.567-8', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Las Condes', region: 'Metropolitana', rubro: 'Construcción', monto: 155000000, fecha: '2024-05-14', descripcion: 'Mejoramiento vías ciclistas sector oriente' },
  // Maipú
  { id: 'OC-2024-0022', proveedor: 'Aseo Total S.A.', rut: '78.345.678-9', organismo: 'Dir. de Aseo y Ornato', municipalidad: 'Municipalidad de Maipú', region: 'Metropolitana', rubro: 'Servicios', monto: 112000000, fecha: '2024-01-08', descripcion: 'Servicio recolección residuos domiciliarios Q1' },
  { id: 'OC-2024-0023', proveedor: 'Constructora Maipú Norte SpA', rut: '89.456.789-0', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Maipú', region: 'Metropolitana', rubro: 'Construcción', monto: 195000000, fecha: '2024-01-30', descripcion: 'Construcción paseo peatonal Av. Pajaritos' },
  { id: 'OC-2024-0024', proveedor: 'CateringPro Chile S.A.', rut: '80.567.890-1', organismo: 'DAEM Maipú', municipalidad: 'Municipalidad de Maipú', region: 'Metropolitana', rubro: 'Alimentación', monto: 168000000, fecha: '2024-03-01', descripcion: 'Alimentación escolar 2024 sector norte' },
  { id: 'OC-2024-0025', proveedor: 'Aseo Total S.A.', rut: '78.345.678-9', organismo: 'Dir. de Aseo y Ornato', municipalidad: 'Municipalidad de Maipú', region: 'Metropolitana', rubro: 'Servicios', monto: 112000000, fecha: '2024-04-08', descripcion: 'Servicio recolección residuos domiciliarios Q2' },
  { id: 'OC-2024-0026', proveedor: 'Constructora Maipú Norte SpA', rut: '89.456.789-0', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Maipú', region: 'Metropolitana', rubro: 'Construcción', monto: 87000000, fecha: '2024-05-20', descripcion: 'Pavimentación calles Villa El Abrazo' },
  // La Florida
  { id: 'OC-2024-0027', proveedor: 'TechGov Solutions SpA', rut: '90.567.890-1', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de La Florida', region: 'Metropolitana', rubro: 'Tecnología', monto: 54000000, fecha: '2024-02-01', descripcion: 'Sistema información ciudadana digital' },
  { id: 'OC-2024-0028', proveedor: 'Constructora Sur Poniente S.A.', rut: '91.678.901-2', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de La Florida', region: 'Metropolitana', rubro: 'Construcción', monto: 134000000, fecha: '2024-02-20', descripcion: 'Remodelación multicancha Villa Bavaria' },
  { id: 'OC-2024-0029', proveedor: 'CateringPro Chile S.A.', rut: '80.567.890-1', organismo: 'DAEM La Florida', municipalidad: 'Municipalidad de La Florida', region: 'Metropolitana', rubro: 'Alimentación', monto: 145000000, fecha: '2024-03-15', descripcion: 'Raciones alimentarias 2024' },
  { id: 'OC-2024-0030', proveedor: 'TechGov Solutions SpA', rut: '90.567.890-1', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de La Florida', region: 'Metropolitana', rubro: 'Tecnología', monto: 38000000, fecha: '2024-04-10', descripcion: 'Mantención plataforma web municipal' },
  // Puente Alto
  { id: 'OC-2024-0031', proveedor: 'Constructora Cordillera S.A.', rut: '92.789.012-3', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Puente Alto', region: 'Metropolitana', rubro: 'Construcción', monto: 285000000, fecha: '2024-01-22', descripcion: 'Construcción Liceo Politécnico Poniente' },
  { id: 'OC-2024-0032', proveedor: 'Aseo Total S.A.', rut: '78.345.678-9', organismo: 'Dir. de Aseo y Ornato', municipalidad: 'Municipalidad de Puente Alto', region: 'Metropolitana', rubro: 'Servicios', monto: 128000000, fecha: '2024-02-08', descripcion: 'Servicio limpieza y recolección RSD' },
  { id: 'OC-2024-0033', proveedor: 'Constructora Cordillera S.A.', rut: '92.789.012-3', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Puente Alto', region: 'Metropolitana', rubro: 'Construcción', monto: 175000000, fecha: '2024-03-18', descripcion: 'Mejoramiento Parque Urbano Lo Espejo' },
  // Concepción
  { id: 'OC-2024-0034', proveedor: 'Biobío Construcciones S.A.', rut: '93.890.123-4', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Concepción', region: 'Biobío', rubro: 'Construcción', monto: 310000000, fecha: '2024-01-30', descripcion: 'Construcción puente peatonal sector Hualpén' },
  { id: 'OC-2024-0035', proveedor: 'TechSur SpA', rut: '94.901.234-5', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Concepción', region: 'Biobío', rubro: 'Tecnología', monto: 89000000, fecha: '2024-02-14', descripcion: 'Plataforma digital gestión ciudadana' },
  { id: 'OC-2024-0036', proveedor: 'Biobío Construcciones S.A.', rut: '93.890.123-4', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Concepción', region: 'Biobío', rubro: 'Construcción', monto: 198000000, fecha: '2024-03-25', descripcion: 'Pavimentación Av. Los Carrera tramo 3' },
  { id: 'OC-2024-0037', proveedor: 'Servicios Generales Sur Ltda.', rut: '95.012.345-6', organismo: 'DIDECO', municipalidad: 'Municipalidad de Concepción', region: 'Biobío', rubro: 'Servicios', monto: 45000000, fecha: '2024-04-10', descripcion: 'Mantención equipamiento deportivo comunal' },
  // Viña del Mar
  { id: 'OC-2024-0038', proveedor: 'Constructora Costa SpA', rut: '96.123.456-7', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Viña del Mar', region: 'Valparaíso', rubro: 'Construcción', monto: 225000000, fecha: '2024-02-01', descripcion: 'Remodelación borde costero sector norte' },
  { id: 'OC-2024-0039', proveedor: 'EventosMar Ltda.', rut: '97.234.567-8', organismo: 'Dir. de Turismo y Cultura', municipalidad: 'Municipalidad de Viña del Mar', region: 'Valparaíso', rubro: 'Servicios', monto: 340000000, fecha: '2024-02-15', descripcion: 'Festival Internacional de la Canción 2024' },
  { id: 'OC-2024-0040', proveedor: 'Constructora Costa SpA', rut: '96.123.456-7', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Viña del Mar', region: 'Valparaíso', rubro: 'Construcción', monto: 142000000, fecha: '2024-04-05', descripcion: 'Mejoramiento plaza sector Reñaca' },
  { id: 'OC-2024-0041', proveedor: 'CateringPro Chile S.A.', rut: '80.567.890-1', organismo: 'DAEM Viña del Mar', municipalidad: 'Municipalidad de Viña del Mar', region: 'Valparaíso', rubro: 'Alimentación', monto: 156000000, fecha: '2024-04-20', descripcion: 'Raciones alimentarias 2024' },
  // Temuco
  { id: 'OC-2024-0042', proveedor: 'Constructora Araucanía SpA', rut: '98.345.678-9', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Temuco', region: 'La Araucanía', rubro: 'Construcción', monto: 178000000, fecha: '2024-01-25', descripcion: 'Construcción sede cultural mapuche' },
  { id: 'OC-2024-0043', proveedor: 'TechAraucanía Ltda.', rut: '99.456.789-0', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Temuco', region: 'La Araucanía', rubro: 'Tecnología', monto: 63000000, fecha: '2024-02-20', descripcion: 'Digitalización trámites municipales' },
  { id: 'OC-2024-0044', proveedor: 'Constructora Araucanía SpA', rut: '98.345.678-9', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Temuco', region: 'La Araucanía', rubro: 'Construcción', monto: 132000000, fecha: '2024-03-30', descripcion: 'Mejoramiento calles sector rural norte' },
  { id: 'OC-2024-0045', proveedor: 'Servicios Generales Sur Ltda.', rut: '95.012.345-6', organismo: 'DIDECO', municipalidad: 'Municipalidad de Temuco', region: 'La Araucanía', rubro: 'Servicios', monto: 38000000, fecha: '2024-04-15', descripcion: 'Servicio aseo dependencias municipales' },
  // Antofagasta
  { id: 'OC-2024-0046', proveedor: 'Minería y Obras SpA', rut: '76.654.321-0', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Antofagasta', region: 'Antofagasta', rubro: 'Construcción', monto: 420000000, fecha: '2024-01-15', descripcion: 'Construcción terminal buses interurbano' },
  { id: 'OC-2024-0047', proveedor: 'Desierto Digital SpA', rut: '77.765.432-1', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Antofagasta', region: 'Antofagasta', rubro: 'Tecnología', monto: 95000000, fecha: '2024-02-10', descripcion: 'Sistema GIS territorial municipal' },
  { id: 'OC-2024-0048', proveedor: 'Minería y Obras SpA', rut: '76.654.321-0', organismo: 'Dirección de Obras', municipalidad: 'Municipalidad de Antofagasta', region: 'Antofagasta', rubro: 'Construcción', monto: 265000000, fecha: '2024-03-20', descripcion: 'Ampliación Estadio Regional Calvo y Bascuñán' },
  { id: 'OC-2024-0049', proveedor: 'Transportes Desierto S.A.', rut: '78.876.543-2', organismo: 'DIDECO', municipalidad: 'Municipalidad de Antofagasta', region: 'Antofagasta', rubro: 'Transporte', monto: 72000000, fecha: '2024-04-08', descripcion: 'Transporte escolar zona norte' },
  { id: 'OC-2024-0050', proveedor: 'Desierto Digital SpA', rut: '77.765.432-1', organismo: 'Secretaría Municipal', municipalidad: 'Municipalidad de Antofagasta', region: 'Antofagasta', rubro: 'Tecnología', monto: 48000000, fecha: '2024-05-12', descripcion: 'Cámaras vigilancia inteligente zona costera' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function montoTotalPorMunicipalidad() {
  const map: Record<string, number> = {};
  for (const o of ordenes) {
    map[o.municipalidad] = (map[o.municipalidad] ?? 0) + o.monto;
  }
  return Object.entries(map)
    .map(([name, monto]) => ({ name: name.replace('Municipalidad de ', ''), monto }))
    .sort((a, b) => b.monto - a.monto);
}

export function distribucionRubro(municipalidad: string) {
  const filtered = municipalidad ? ordenes.filter(o => o.municipalidad === municipalidad) : ordenes;
  const map: Record<string, number> = {};
  for (const o of filtered) {
    map[o.rubro] = (map[o.rubro] ?? 0) + o.monto;
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([name, monto]) => ({ name, monto, pct: total > 0 ? Math.round((monto / total) * 100) : 0 }))
    .sort((a, b) => b.monto - a.monto);
}

export interface ConcentracionProveedor {
  proveedor: string;
  rut: string;
  monto: number;
  contratos: number;
  pct: number;
}

export function concentracionProveedores(municipalidad: string): ConcentracionProveedor[] {
  const filtered = municipalidad ? ordenes.filter(o => o.municipalidad === municipalidad) : ordenes;
  const map: Record<string, { proveedor: string; rut: string; monto: number; contratos: number }> = {};
  for (const o of filtered) {
    if (!map[o.rut]) map[o.rut] = { proveedor: o.proveedor, rut: o.rut, monto: 0, contratos: 0 };
    map[o.rut].monto += o.monto;
    map[o.rut].contratos += 1;
  }
  const total = filtered.reduce((s, o) => s + o.monto, 0);
  return Object.values(map)
    .map(v => ({ ...v, pct: total > 0 ? Math.round((v.monto / total) * 100) : 0 }))
    .sort((a, b) => b.monto - a.monto);
}
