# Licitapp

Aplicación web para analizar el mercado público chileno (órdenes de compra y licitaciones de Mercado Público / ChileCompra). Permite explorar la actividad por territorio, revisar la concentración de proveedores y compradores, y buscar oportunidades por rubro.

Despliegue: https://proyecto-licitapp.vercel.app/

## Descripción

Licitapp toma los datos abiertos de Mercado Público y los ordena en tres vistas que cubren el flujo de trabajo de un analista o consultor del sector público: dónde está la actividad, quién domina el mercado y qué oportunidad conviene revisar. Trabaja sobre el universo completo de datos (alrededor de 1,5 millones de órdenes de compra y 95 mil licitaciones), no sobre muestras.

## Vistas principales

1. **Mapa.** Explorador territorial. Mapa coroplético por comuna con métricas de monto y cantidad de órdenes y licitaciones. Al seleccionar una comuna se puede saltar a Órdenes o Licitaciones ya filtradas.
2. **Órdenes de compra.** Inteligencia competitiva. Termómetro de concentración del mercado y ranking de proveedores y organismos compradores, con perfil de cada organismo (gasto, tasa de adjudicación, qué compra y a quién).
3. **Licitaciones.** Radar de oportunidades. Búsqueda por rubro sobre los ítems de cada licitación, filtros por región, comuna, estado y tipo, y un bloque de contexto competitivo para evaluar si conviene ofertar.

## Funcionalidades

- Filtrado real en cascada por región y comuna, con re consulta al servidor.
- Búsqueda de licitaciones por rubro indexando la categoría ONU/UNSPSC y la descripción de los ítems.
- Perfil navegable de organismo comprador y de proveedor.
- Paginación con total de resultados y navegación por páginas.
- Estados de carga, vacío y error; notificaciones y accesibilidad (ARIA, foco y teclado).
- Diseño responsivo.

## Stack tecnológico

- Next.js 16 (App Router) y React 19
- TypeScript y Tailwind CSS 4
- Supabase (PostgreSQL, funciones RPC y vistas materializadas)
- MapLibre GL y deck.gl para el mapa coroplético
- Recharts para gráficos, lucide-react para íconos, sonner para notificaciones
- Despliegue en Vercel

## Estructura del repositorio

```
src/
  app/
    page.tsx              Landing
    (app)/mapa/           Vista de mapa
    (app)/dashboard/      Vista de órdenes de compra
    (app)/licitaciones/   Vista de licitaciones
  components/             Componentes de UI y de mapa
  lib/data/               Acceso a datos (Supabase RPC)
scripts/
  extractor.py            Extractor de la API de Mercado Público
  build-comunas-geojson.mjs
public/                   GeoJSON de comunas y recursos estáticos
.github/workflows/        Extractor programado (GitHub Actions)
```

## Requisitos

- Node.js 18 o superior
- Yarn (el proyecto usa Yarn; también funciona con npm)
- Una instancia de Supabase con los datos cargados

## Configuración

Crear un archivo `.env.local` en la raíz con las credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

La `SUPABASE_SERVICE_ROLE_KEY` solo se usa para el extractor de datos, no para la aplicación web.

## Ejecución local

```bash
yarn install
yarn dev
```

La aplicación queda disponible en http://localhost:3000.

Otros comandos:

```bash
yarn build    # compilación de producción
yarn start    # servir la compilación
yarn lint     # ESLint
yarn test     # pruebas con Jest
```

## Datos y actualización

Los datos provienen de la API pública de Mercado Público y se cargan en Supabase mediante un extractor en Python (`scripts/extractor.py`), que se ejecuta de forma programada con GitHub Actions. Requiere tickets de la API de Mercado Público y la service role key de Supabase (ver `scripts/.env.example`).

Las vistas materializadas que alimentan la aplicación se refrescan a diario mediante un trabajo programado en la base de datos (pg_cron).

## Despliegue

El proyecto está desplegado en Vercel. Para que la aplicación muestre datos, las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` deben estar configuradas en el entorno de Vercel, ya que se incrustan en tiempo de compilación.

## Contexto

Proyecto del curso IIC2182 (Interfaces y Experiencia de Usuario), Pontificia Universidad Católica de Chile.

Integrantes: Fernando Concha, Javier Larré y Monserrat Benavides.
