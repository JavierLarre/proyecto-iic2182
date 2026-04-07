#!/usr/bin/env python3
"""
Extractor de datos de Mercado Público (ChileCompra) → Supabase
===============================================================
Descarga masiva de Licitaciones y Órdenes de Compra día a día,
extrae los campos relevantes para análisis territorial y los
persiste en Supabase con soporte de reanudación y rate limiting.

MODOS DE USO
────────────
Modo automático (cron nocturno recomendado):
    python extractor.py --modo auto
    python extractor.py --modo auto --hasta 01012020
    python extractor.py --modo auto --solo licitaciones

    Comportamiento: descarga de más reciente a más antiguo, saltando
    automáticamente las fechas ya completadas. Ideal para cron nocturnos.

Modo manual (rango explícito):
    python extractor.py --modo manual --inicio 01012024 --fin 31012024
    python extractor.py --modo manual --inicio 01012024 --fin 31012024 --solo licitaciones
    python extractor.py --modo manual --inicio 01012024 --fin 31012024 --forzar

Opciones comunes:
    --max-requests N    Límite total de requests (default: 9800 × n_tickets)
    --solo              licitaciones | ordenes
    --forzar            Reprocesar incluso fechas ya completadas

Requisitos:
    pip install -r requirements.txt
    Copiar .env.example → .env y completar las variables
"""

import os
import sys
import time
import argparse
import logging
from datetime import datetime, date, timedelta
from typing import Optional

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ─────────────────────────────────────────────
# Configuración
# ─────────────────────────────────────────────
load_dotenv()

TICKETS = [t for t in [
    os.getenv("MERCADOPUBLICO_TICKET_1"),
    os.getenv("MERCADOPUBLICO_TICKET_2"),
    os.getenv("MERCADOPUBLICO_TICKET_3"),
] if t]  # Solo los que estén configurados

SUPABASE_URL     = os.getenv("SUPABASE_URL", "https://dwlsmwlvftfjqrcbifwh.supabase.co")
SUPABASE_KEY     = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")   # Usar service role (no anon)

BASE_URL_LIC     = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json"
BASE_URL_OC      = "https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, */*",
    "Accept-Language": "es-CL,es;q=0.9",
}

MAX_REQUESTS_DAY = 10_000        # Hard limit por ticket (total = tickets × 10.000)
REQUEST_DELAY    = 0.3           # Segundos entre requests (evita saturar la API)
RETRY_MAX        = 3             # Reintentos ante error de red
RETRY_BACKOFF    = 5             # Segundos de espera base para retry
BATCH_SIZE       = 10            # Registros por upsert a Supabase

# Mapas de estado
ESTADO_LIC = {5: "Publicada", 6: "Cerrada", 7: "Desierta", 8: "Adjudicada", 18: "Revocada", 19: "Suspendida"}
ESTADO_OC  = {4: "Enviada a Proveedor", 5: "En proceso", 6: "Aceptada", 9: "Cancelada",
               12: "Recepción Conforme", 13: "Pendiente de Recepcionar",
               14: "Recepcionada Parcialmente", 15: "Recepcion Conforme Incompleta"}

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("extractor.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Rate Limiter con rotación de tickets
# ─────────────────────────────────────────────
class RateLimiter:
    """
    Rota entre múltiples tickets automáticamente.
    Cada ticket tiene su propio contador de 10.000 requests/día.
    Total disponible = len(tickets) × 10.000.
    """
    def __init__(self, tickets: list[str], max_per_ticket: int):
        if not tickets:
            raise ValueError("Se necesita al menos 1 ticket configurado en .env")
        self.tickets         = tickets
        self.max_per_ticket  = max_per_ticket
        self.counts          = [0] * len(tickets)
        self.current         = 0
        log.info(f"Tickets configurados: {len(tickets)} — capacidad total: {len(tickets) * max_per_ticket:,} requests/día")

    def current_ticket(self) -> str:
        return self.tickets[self.current]

    def tick(self):
        self.counts[self.current] += 1
        if self.counts[self.current] >= self.max_per_ticket:
            if self.current + 1 < len(self.tickets):
                log.warning(f"Ticket {self.current + 1} agotado → rotando al ticket {self.current + 2}")
                self.current += 1
            else:
                raise RuntimeError(
                    f"Todos los tickets agotados ({self.total_used():,} requests usados). "
                    "Detención preventiva."
                )

    def total_used(self) -> int:
        return sum(self.counts)

    def remaining(self) -> int:
        remaining_current = self.max_per_ticket - self.counts[self.current]
        remaining_future  = (len(self.tickets) - self.current - 1) * self.max_per_ticket
        return remaining_current + remaining_future


# ─────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────
def _get(url: str, params: dict, limiter: RateLimiter) -> Optional[dict]:
    """GET con reintentos y rate limiting."""
    params["ticket"] = limiter.current_ticket()
    for intento in range(1, RETRY_MAX + 1):
        try:
            limiter.tick()
            resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
            time.sleep(REQUEST_DELAY)

            if resp.status_code == 404:
                log.debug(f"404 en {url} params={params}")
                return None
            if resp.status_code == 200:
                return resp.json()

            log.warning(f"HTTP {resp.status_code} en intento {intento}/{RETRY_MAX}: {url}")
        except requests.exceptions.RequestException as e:
            log.warning(f"Error de red intento {intento}/{RETRY_MAX}: {e}")
        except RuntimeError:
            raise  # Re-lanzar límite alcanzado

        if intento < RETRY_MAX:
            espera = RETRY_BACKOFF * intento
            log.info(f"Reintentando en {espera}s...")
            time.sleep(espera)

    log.error(f"Request fallido tras {RETRY_MAX} intentos: {url}")
    return None


def get_codigos_por_fecha(tipo: str, fecha_str: str, limiter: RateLimiter) -> list[str]:
    """Obtiene lista de códigos para una fecha (formato ddmmaaaa)."""
    url = BASE_URL_LIC if tipo == "licitacion" else BASE_URL_OC
    data = _get(url, {"fecha": fecha_str}, limiter)
    if not data:
        return []
    listado = data.get("Listado", []) or []
    if tipo == "licitacion":
        return [item.get("CodigoExterno") for item in listado if item.get("CodigoExterno")]
    else:
        return [item.get("Codigo") for item in listado if item.get("Codigo")]


def get_detalle(tipo: str, codigo: str, limiter: RateLimiter) -> Optional[dict]:
    """Obtiene el detalle completo de una licitación u OC por código."""
    url = BASE_URL_LIC if tipo == "licitacion" else BASE_URL_OC
    data = _get(url, {"codigo": codigo}, limiter)
    if not data:
        return None
    listado = data.get("Listado", []) or []
    if not listado:
        return None
    return listado[0]


# ─────────────────────────────────────────────
# Parsers de datos
# ─────────────────────────────────────────────
def _safe_float(val) -> Optional[float]:
    try:
        return float(str(val).replace(".", "").replace(",", ".")) if val is not None else None
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> Optional[int]:
    try:
        return int(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _parse_fecha(val: Optional[str]) -> Optional[str]:
    """Convierte fecha de la API (ISO o dd/mm/aaaa) a ISO 8601."""
    if not val:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val, fmt).isoformat()
        except ValueError:
            continue
    return None


def parse_licitacion(raw: dict) -> tuple[dict, list[dict]]:
    """
    Retorna (registro_licitacion, [items]).
    """
    comp = raw.get("Comprador", {}) or {}
    items_raw = (raw.get("Items", {}) or {}).get("Listado", []) or []

    licitacion = {
        "codigo_externo":     raw.get("CodigoExterno"),
        "nombre":             raw.get("Nombre"),
        "descripcion":        raw.get("Descripcion"),
        "estado":             _safe_int(raw.get("CodigoEstado")),
        "estado_texto":       ESTADO_LIC.get(_safe_int(raw.get("CodigoEstado")), raw.get("Estado")),
        "tipo_licitacion":    raw.get("Tipo"),
        "monto_estimado":     _safe_float(raw.get("MontoEstimado")),
        "unidad_monetaria":   raw.get("Moneda"),
        "fecha_publicacion":  _parse_fecha(raw.get("FechaPublicacion")),
        "fecha_cierre":       _parse_fecha(raw.get("FechaCierre")),
        "fecha_adjudicacion": _parse_fecha(raw.get("FechaAdjudicacion")),
        "comprador_rut":      comp.get("RutUnidad"),
        "comprador_nombre":   comp.get("NombreOrganismo"),
        "comprador_region":   comp.get("RegionUnidad"),
        "comprador_comuna":   comp.get("ComunaUnidad"),
        "raw_data":           raw,
    }

    items = []
    for it in items_raw:
        adj = it.get("Adjudicacion", {}) or {}
        items.append({
            "licitacion_codigo":           licitacion["codigo_externo"],
            "numero_linea":                _safe_int(it.get("Correlativo")),
            "nombre_producto":             it.get("NombreProducto") or it.get("Producto"),
            "descripcion":                 it.get("Descripcion"),
            "cantidad":                    _safe_float(it.get("Cantidad")),
            "unidad_medida":               it.get("UnidadMedida"),
            "precio_neto_unitario":        _safe_float(it.get("PrecioNeto")),
            "rut_proveedor_adjudicado":    adj.get("RutProveedor"),
            "nombre_proveedor_adjudicado": adj.get("NombreProveedor"),
            "monto_unitario_adjudicado":   _safe_float(adj.get("MontoUnitario")),
            "cantidad_adjudicada":         _safe_float(adj.get("CantidadAdjudicada")),
        })

    return licitacion, items


def parse_orden_compra(raw: dict) -> tuple[dict, list[dict], Optional[dict], Optional[dict]]:
    """
    Retorna (registro_oc, [items], comprador_dict, proveedor_dict).
    """
    comp = raw.get("Comprador", {}) or {}
    prov = raw.get("Proveedor", {}) or {}
    items_raw = (raw.get("Items", {}) or {}).get("Listado", []) or []

    oc = {
        "codigo":            raw.get("Codigo"),
        "nombre":            raw.get("Nombre"),
        "estado":            _safe_int(raw.get("CodigoEstado")),
        "estado_texto":      ESTADO_OC.get(_safe_int(raw.get("CodigoEstado")), raw.get("Estado")),
        "total":             _safe_float(raw.get("Total")),
        "total_neto":        _safe_float(raw.get("TotalNeto")),
        "unidad_monetaria":  raw.get("Moneda"),
        "fecha_creacion":    _parse_fecha(raw.get("FechaCreacion")),
        "fecha_envio":       _parse_fecha(raw.get("FechaEnvio")),
        "comprador_rut":     comp.get("RutUnidad"),
        "comprador_nombre":  comp.get("NombreOrganismo"),
        "comprador_region":  comp.get("RegionUnidad"),
        "comprador_comuna":  comp.get("ComunaUnidad"),
        "proveedor_rut":     prov.get("RutSucursal"),
        "proveedor_nombre":  prov.get("Nombre"),
        "proveedor_region":  prov.get("Region"),
        "proveedor_comuna":  prov.get("Comuna"),
        "licitacion_codigo": raw.get("CodigoLicitacion"),
        "raw_data":          raw,
    }

    items = []
    for it in items_raw:
        items.append({
            "orden_codigo":          oc["codigo"],
            "numero_linea":          _safe_int(it.get("Correlativo")),
            "nombre_producto":       it.get("NombreProducto") or it.get("Producto"),
            "descripcion":           it.get("Descripcion"),
            "categoria":             it.get("CodigoCategoria") or it.get("Categoria"),
            "cantidad":              _safe_float(it.get("Cantidad")),
            "unidad_medida":         it.get("UnidadMedida"),
            "precio_neto_unitario":  _safe_float(it.get("PrecioNeto")),
            "precio_total":          _safe_float(it.get("Total")),
        })

    comprador_rec = None
    if comp.get("RutUnidad"):
        comprador_rec = {
            "rut_unidad":       comp.get("RutUnidad"),
            "nombre_organismo": comp.get("NombreOrganismo"),
            "codigo_organismo": comp.get("CodigoOrganismo"),
            "region":           comp.get("RegionUnidad"),
            "comuna":           comp.get("ComunaUnidad"),
            "direccion":        comp.get("DireccionUnidad"),
        }

    proveedor_rec = None
    if prov.get("RutSucursal"):
        proveedor_rec = {
            "rut_sucursal": prov.get("RutSucursal"),
            "nombre":       prov.get("Nombre"),
            "region":       prov.get("Region"),
            "comuna":       prov.get("Comuna"),
            "direccion":    prov.get("Direccion"),
        }

    return oc, items, comprador_rec, proveedor_rec


# ─────────────────────────────────────────────
# Supabase helpers
# ─────────────────────────────────────────────
def upsert_batch(sb: Client, tabla: str, registros: list[dict], conflict_col: str):
    """Upsert en lotes de BATCH_SIZE."""
    if not registros:
        return
    for i in range(0, len(registros), BATCH_SIZE):
        lote = registros[i : i + BATCH_SIZE]
        try:
            sb.table(tabla).upsert(lote, on_conflict=conflict_col).execute()
            log.info(f"  → Guardados {len(lote)} registros en {tabla}")
        except Exception as e:
            log.error(f"Error al guardar en {tabla}: {e}")


def log_inicio(sb: Client, fecha: date, tipo: str):
    sb.table("extraccion_log").upsert(
        {"fecha": fecha.isoformat(), "tipo": tipo, "estado": "pendiente"},
        on_conflict="fecha,tipo",
    ).execute()


def log_fin(sb: Client, fecha: date, tipo: str, estado: str,
            total_codigos: int, total_detalle: int, requests_usados: int,
            mensaje_error: Optional[str] = None):
    sb.table("extraccion_log").upsert(
        {
            "fecha":           fecha.isoformat(),
            "tipo":            tipo,
            "estado":          estado,
            "total_codigos":   total_codigos,
            "total_detalle":   total_detalle,
            "requests_usados": requests_usados,
            "mensaje_error":   mensaje_error,
            "updated_at":      datetime.utcnow().isoformat(),
        },
        on_conflict="fecha,tipo",
    ).execute()


def fecha_ya_procesada(sb: Client, fecha: date, tipo: str) -> bool:
    """Devuelve True si la fecha/tipo ya fue procesada completamente."""
    res = (
        sb.table("extraccion_log")
        .select("estado")
        .eq("fecha", fecha.isoformat())
        .eq("tipo", tipo)
        .execute()
    )
    if res.data:
        return res.data[0]["estado"] == "completado"
    return False


def generar_cola_auto(
    sb: Client,
    hasta: date,
    solo: Optional[str],
    forzar: bool,
) -> list[tuple[date, str]]:
    """
    Construye la cola de trabajo en orden RECIENTE → ANTIGUO.

    Hace una única query bulk a extraccion_log para saber qué está
    completado, luego itera en memoria desde hoy hasta `hasta`.

    Retorna lista de (fecha, tipo) pendientes, más reciente primero.
    Los pares (fecha, tipo) con estado 'completado' se omiten
    (a menos que se use --forzar).
    """
    # ── 1. Cargar todos los estados de una sola query ──────────────
    res = sb.table("extraccion_log").select("fecha,tipo,estado").execute()
    completados: set[tuple[str, str]] = set()
    for row in (res.data or []):
        if row["estado"] == "completado":
            completados.add((row["fecha"], row["tipo"]))

    # ── 2. Decidir qué tipos procesar ─────────────────────────────
    tipos: list[str] = []
    if solo != "ordenes":
        tipos.append("licitacion")
    if solo != "licitaciones":
        tipos.append("orden_compra")

    # ── 3. Iterar de hoy hacia atrás, construir cola ───────────────
    hoy  = date.today()
    cola: list[tuple[date, str]] = []
    fecha = hoy

    while fecha >= hasta:
        for tipo in tipos:
            key = (fecha.isoformat(), tipo)
            if forzar or key not in completados:
                cola.append((fecha, tipo))
        fecha -= timedelta(days=1)

    total_dias = (hoy - hasta).days + 1
    ya_hechos  = sum(
        1 for d in (hasta + timedelta(days=i) for i in range(total_dias))
        for t in tipos
        if (d.isoformat(), t) in completados
    )
    pendientes = len(cola)
    log.info(
        f"Estado del historial ({hasta} → {hoy}): "
        f"{ya_hechos} pares completados, {pendientes} pendientes"
    )
    return cola


# ─────────────────────────────────────────────
# Lógica principal por día
# ─────────────────────────────────────────────
def procesar_dia_licitaciones(sb: Client, fecha: date, limiter: RateLimiter) -> int:
    fecha_str = fecha.strftime("%d%m%Y")
    log.info(f"[LIC] {fecha_str} — requests restantes: {limiter.remaining()}")

    log_inicio(sb, fecha, "licitacion")
    req_inicio = limiter.total_used()

    codigos = get_codigos_por_fecha("licitacion", fecha_str, limiter)
    log.info(f"  → {len(codigos)} licitaciones encontradas")

    licitaciones_batch, items_batch = [], []
    procesados = 0

    for codigo in codigos:
        if limiter.remaining() < 5:
            log.warning("Requests casi agotados, guardando progreso parcial...")
            upsert_batch(sb, "licitaciones", licitaciones_batch, "codigo_externo")
            upsert_batch(sb, "items_licitacion", items_batch, "id")
            log_fin(sb, fecha, "licitacion", "parcial", len(codigos), procesados,
                    limiter.total_used() - req_inicio)
            return procesados

        raw = get_detalle("licitacion", codigo, limiter)
        if not raw:
            continue

        licitacion, items = parse_licitacion(raw)
        if licitacion["codigo_externo"]:
            licitaciones_batch.append(licitacion)
            items_batch.extend(items)
            procesados += 1

        # Flush cada BATCH_SIZE
        if len(licitaciones_batch) >= BATCH_SIZE:
            upsert_batch(sb, "licitaciones", licitaciones_batch, "codigo_externo")
            upsert_batch(sb, "items_licitacion", items_batch, "id")
            licitaciones_batch.clear()
            items_batch.clear()

    # Flush final
    upsert_batch(sb, "licitaciones", licitaciones_batch, "codigo_externo")
    upsert_batch(sb, "items_licitacion", items_batch, "id")

    log_fin(sb, fecha, "licitacion", "completado", len(codigos), procesados,
            limiter.total_used() - req_inicio)
    log.info(f"  ✓ {procesados} licitaciones guardadas")
    return procesados


def procesar_dia_ordenes(sb: Client, fecha: date, limiter: RateLimiter) -> int:
    fecha_str = fecha.strftime("%d%m%Y")
    log.info(f"[OC]  {fecha_str} — requests restantes: {limiter.remaining()}")

    log_inicio(sb, fecha, "orden_compra")
    req_inicio = limiter.total_used()

    codigos = get_codigos_por_fecha("orden_compra", fecha_str, limiter)
    log.info(f"  → {len(codigos)} órdenes encontradas")

    oc_batch, items_batch, compradores_batch, proveedores_batch = [], [], [], []
    procesados = 0
    compradores_vistos, proveedores_vistos = set(), set()

    for codigo in codigos:
        if limiter.remaining() < 5:
            log.warning("Requests casi agotados, guardando progreso parcial...")
            upsert_batch(sb, "compradores",    compradores_batch, "rut_unidad")
            upsert_batch(sb, "proveedores",    proveedores_batch, "rut_sucursal")
            upsert_batch(sb, "ordenes_compra", oc_batch,          "codigo")
            upsert_batch(sb, "items_orden_compra", items_batch,   "id")
            log_fin(sb, fecha, "orden_compra", "parcial", len(codigos), procesados,
                    limiter.total_used() - req_inicio)
            return procesados

        raw = get_detalle("orden_compra", codigo, limiter)
        if not raw:
            continue

        oc, items, comprador, proveedor = parse_orden_compra(raw)
        if oc["codigo"]:
            oc_batch.append(oc)
            items_batch.extend(items)
            procesados += 1

        if comprador and comprador["rut_unidad"] not in compradores_vistos:
            compradores_batch.append(comprador)
            compradores_vistos.add(comprador["rut_unidad"])

        if proveedor and proveedor["rut_sucursal"] not in proveedores_vistos:
            proveedores_batch.append(proveedor)
            proveedores_vistos.add(proveedor["rut_sucursal"])

        # Flush cada BATCH_SIZE
        if len(oc_batch) >= BATCH_SIZE:
            upsert_batch(sb, "compradores",        compradores_batch, "rut_unidad")
            upsert_batch(sb, "proveedores",        proveedores_batch, "rut_sucursal")
            upsert_batch(sb, "ordenes_compra",     oc_batch,          "codigo")
            upsert_batch(sb, "items_orden_compra", items_batch,       "id")
            oc_batch.clear(); items_batch.clear()
            compradores_batch.clear(); proveedores_batch.clear()

    # Flush final
    upsert_batch(sb, "compradores",        compradores_batch, "rut_unidad")
    upsert_batch(sb, "proveedores",        proveedores_batch, "rut_sucursal")
    upsert_batch(sb, "ordenes_compra",     oc_batch,          "codigo")
    upsert_batch(sb, "items_orden_compra", items_batch,       "id")

    log_fin(sb, fecha, "orden_compra", "completado", len(codigos), procesados,
            limiter.total_used() - req_inicio)
    log.info(f"  ✓ {procesados} órdenes de compra guardadas")
    return procesados


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(
        description="Extractor Mercado Público → Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--modo", choices=["auto", "manual"], default="auto",
        help="auto: reciente→antiguo inteligente (cron). manual: rango explícito.",
    )
    # Auto mode
    p.add_argument(
        "--hasta", default="01012020",
        help="[auto] Fecha más antigua a procesar ddmmaaaa (default: 01012020)",
    )
    # Manual mode
    p.add_argument("--inicio", help="[manual] Fecha inicio ddmmaaaa")
    p.add_argument("--fin",    help="[manual] Fecha fin ddmmaaaa")
    # Comunes
    p.add_argument(
        "--solo", choices=["licitaciones", "ordenes"], default=None,
        help="Extraer solo un tipo (default: ambos)",
    )
    p.add_argument(
        "--max-requests", type=int, default=None,
        help=f"Límite total de requests. Default: {MAX_REQUESTS_DAY} × nro_tickets",
    )
    p.add_argument(
        "--forzar", action="store_true",
        help="Reprocesar fechas ya marcadas como completadas",
    )
    return p.parse_args()


def _procesar_cola(
    sb: Client,
    limiter: RateLimiter,
    cola: list[tuple[date, str]],
    max_req: int,
):
    """Procesa una lista ordenada de (fecha, tipo) respetando el rate limit."""
    total = len(cola)
    for i, (fecha, tipo) in enumerate(cola):
        if limiter.remaining() < 5:
            log.warning("Requests agotados para esta sesión.")
            break

        log.info(f"\n{'─'*50}")
        log.info(
            f"[{i+1}/{total}] {fecha.strftime('%d/%m/%Y')} | {tipo} "
            f"| usados: {limiter.total_used():,} | restantes: {limiter.remaining():,}"
        )

        if tipo == "licitacion":
            procesar_dia_licitaciones(sb, fecha, limiter)
        else:
            procesar_dia_ordenes(sb, fecha, limiter)


def main():
    args = parse_args()

    if not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_ROLE_KEY no está configurada. Copia .env.example → .env")
        sys.exit(1)

    max_req = args.max_requests or (MAX_REQUESTS_DAY * len(TICKETS))
    sb      = create_client(SUPABASE_URL, SUPABASE_KEY)
    limiter = RateLimiter(TICKETS, MAX_REQUESTS_DAY)

    log.info(f"\n{'═'*50}")
    log.info(f"Modo: {args.modo.upper()} | Max requests sesión: {max_req:,}")

    try:
        if args.modo == "auto":
            # ── Modo automático: reciente → antiguo, skip completados ──
            try:
                hasta = datetime.strptime(args.hasta, "%d%m%Y").date()
            except ValueError:
                log.error(f"Formato --hasta inválido: '{args.hasta}'. Usar ddmmaaaa")
                sys.exit(1)

            log.info(f"Rango: hoy → {hasta} | Solo: {args.solo or 'ambos'}")
            cola = generar_cola_auto(sb, hasta, args.solo, args.forzar)

            if not cola:
                log.info("No hay fechas pendientes. Base de datos al día.")
                return

            _procesar_cola(sb, limiter, cola, max_req)

        else:
            # ── Modo manual: rango explícito ───────────────────────────
            if not args.inicio or not args.fin:
                log.error("--modo manual requiere --inicio y --fin")
                sys.exit(1)
            try:
                fecha_inicio = datetime.strptime(args.inicio, "%d%m%Y").date()
                fecha_fin    = datetime.strptime(args.fin,    "%d%m%Y").date()
            except ValueError as e:
                log.error(f"Formato de fecha inválido: {e}. Usar ddmmaaaa (ej: 01012024)")
                sys.exit(1)

            if fecha_inicio > fecha_fin:
                log.error("--inicio debe ser anterior a --fin")
                sys.exit(1)

            total_dias = (fecha_fin - fecha_inicio).days + 1
            log.info(f"Rango: {fecha_inicio} → {fecha_fin} ({total_dias} días)")

            # Construir cola manual (antiguo → reciente, respeta --forzar)
            cola: list[tuple[date, str]] = []
            fecha = fecha_inicio
            while fecha <= fecha_fin:
                if args.solo != "ordenes":
                    if args.forzar or not fecha_ya_procesada(sb, fecha, "licitacion"):
                        cola.append((fecha, "licitacion"))
                if args.solo != "licitaciones":
                    if args.forzar or not fecha_ya_procesada(sb, fecha, "orden_compra"):
                        cola.append((fecha, "orden_compra"))
                fecha += timedelta(days=1)

            _procesar_cola(sb, limiter, cola, max_req)

    except RuntimeError as e:
        log.error(f"\n⚠️  {e}")
        sys.exit(1)

    log.info(f"\n{'═'*50}")
    log.info(f"Sesión finalizada. Total requests usados: {limiter.total_used():,}")


if __name__ == "__main__":
    main()
