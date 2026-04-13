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
from datetime import datetime, date, timedelta, timezone
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
FLUSH_SIZE        = 50   # Cada cuántos registros hacer flush a Supabase (batch externo)
CHUNK_MAIN        = 20   # Registros por llamada upsert en tablas con raw_data (licitaciones, ordenes_compra)
CHUNK_ITEMS       = 200  # Registros por llamada upsert en tablas de items y lookup
SESSION_LIMIT_SECONDS = 5 * 3600 + 20 * 60  # 5h 20m — margen de 20m antes del timeout de 340min del workflow

# Mapas de estado
ESTADO_LIC = {5: "Publicada", 6: "Cerrada", 7: "Desierta", 8: "Adjudicada", 18: "Revocada", 19: "Suspendida"}
ESTADO_OC  = {4: "Enviada a Proveedor", 5: "En proceso", 6: "Aceptada", 9: "Cancelada",
               12: "Recepción Conforme", 13: "Pendiente de Recepcionar",
               14: "Recepcionada Parcialmente", 15: "Recepcion Conforme Incompleta"}

# Estados que indican que el registro no cambiará más → se salta con seguridad sin re-fetchear
# Los registros con estado no-final se re-descargan para capturar cambios (ej: adjudicación)
ESTADOS_FINALES_LIC = {7, 8, 18, 19}   # Desierta, Adjudicada, Revocada, Suspendida
ESTADOS_FINALES_OC  = {9, 12}           # Cancelada, Recepción Conforme

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


class TiempoAgotado(Exception):
    """Señal de parada limpia: la sesión alcanzó el límite de tiempo configurado."""
    pass


# ─────────────────────────────────────────────
# Utilidades de logging
# ─────────────────────────────────────────────
def _fmt_dur(segundos: float) -> str:
    """Formatea segundos a string legible: 3h 04m 07s / 14m 03s / 47s."""
    s = max(0, int(segundos))
    if s < 60:
        return f"{s}s"
    m, s = divmod(s, 60)
    if m < 60:
        return f"{m}m {s:02d}s"
    h, m = divmod(m, 60)
    return f"{h}h {m:02d}m {s:02d}s"


def _barra(actual: int, total: int, ancho: int = 12) -> str:
    """Barra de progreso ASCII. Ej: ████████░░░░"""
    if total == 0:
        return "░" * ancho
    filled = min(ancho, int(ancho * actual / total))
    return "█" * filled + "░" * (ancho - filled)


# ─────────────────────────────────────────────
# Rate Limiter con rotación de tickets
# ─────────────────────────────────────────────
class RateLimiter:
    """
    Rota entre múltiples tickets en round-robin estricto.
    Cada ticket tiene su propio contador de 10.000 requests/día.
    Total disponible = len(tickets) × 10.000.
    """
    def __init__(self, tickets: list[str], max_per_ticket: int):
        if not tickets:
            raise ValueError("Se necesita al menos 1 ticket configurado en .env")
        self.tickets        = tickets
        self.max_per_ticket = max_per_ticket
        self.counts         = [0] * len(tickets)
        self._call_idx      = 0  # puntero round-robin
        log.info(f"Tickets configurados: {len(tickets)} — capacidad total: {len(tickets) * max_per_ticket:,} requests/día")

    def get_and_tick(self) -> str:
        """Devuelve el próximo ticket disponible (round-robin) e incrementa su contador."""
        n = len(self.tickets)
        for offset in range(n):
            idx = (self._call_idx + offset) % n
            if self.counts[idx] < self.max_per_ticket:
                self.counts[idx] += 1
                if self.counts[idx] == self.max_per_ticket:
                    log.warning(f"Ticket {idx + 1} agotado ({self.max_per_ticket:,} requests)")
                self._call_idx = (idx + 1) % n
                return self.tickets[idx]
        raise RuntimeError(
            f"Todos los tickets agotados ({self.total_used():,} requests usados). "
            "Detención preventiva."
        )

    def total_used(self) -> int:
        return sum(self.counts)

    def remaining(self) -> int:
        return sum(max(0, self.max_per_ticket - c) for c in self.counts)


# ─────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────
def _get(url: str, params: dict, limiter: RateLimiter) -> Optional[dict]:
    """GET con reintentos y rate limiting round-robin."""
    for intento in range(1, RETRY_MAX + 1):
        try:
            ticket = limiter.get_and_tick()
            resp = requests.get(url, params={**params, "ticket": ticket}, headers=HEADERS, timeout=90)
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


def get_codigos_por_fecha(tipo: str, fecha_str: str, limiter: RateLimiter) -> Optional[list[str]]:
    """Obtiene lista de códigos para una fecha (formato ddmmaaaa).
    Retorna None si la API falló (error HTTP / timeout / tickets agotados).
    Retorna [] si la API respondió OK pero no hay registros para esa fecha.
    """
    url = BASE_URL_LIC if tipo == "licitacion" else BASE_URL_OC
    data = _get(url, {"fecha": fecha_str}, limiter)
    if data is None:
        # _get devuelve None solo cuando todos los reintentos fallaron —
        # no sabemos si la fecha tiene datos; NO marcar como completado.
        return None
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
def _trunc(val, n: int = 1000) -> Optional[str]:
    """Trunca strings largos para no superar límites de columnas VARCHAR en Supabase."""
    if val is None:
        return None
    s = str(val)
    return s[:n] if len(s) > n else s


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
    # Normalizar milisegundos: la API devuelve 1 a 7 dígitos fraccionarios,
    # pero %f de Python solo acepta exactamente 6. Truncamos a 6.
    import re as _re
    val_norm = _re.sub(r'(\.\d{1,6})\d*$', lambda m: m.group(1).ljust(7, '0')[:7], val)
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%f",  # ISO con milisegundos (caso más común en la API)
        "%Y-%m-%dT%H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(val_norm, fmt).isoformat()
        except ValueError:
            continue
    return None


def parse_licitacion(raw: dict) -> tuple[dict, list[dict]]:
    """
    Retorna (registro_licitacion, [items]).
    """
    comp = raw.get("Comprador", {}) or {}
    items_raw = (raw.get("Items", {}) or {}).get("Listado", []) or []
    fechas = raw.get("Fechas", {}) or {}

    licitacion = {
        "codigo_externo":     raw.get("CodigoExterno"),
        "nombre":             raw.get("Nombre"),
        "descripcion":        raw.get("Descripcion"),
        "estado":             _safe_int(raw.get("CodigoEstado")),
        "estado_texto":       ESTADO_LIC.get(_safe_int(raw.get("CodigoEstado")), raw.get("Estado")),
        "tipo_licitacion":    raw.get("Tipo"),
        "monto_estimado":     _safe_float(raw.get("MontoEstimado")),
        "unidad_monetaria":   raw.get("Moneda"),
        # Las fechas están siempre bajo el objeto "Fechas", no en la raíz
        "fecha_publicacion":  _parse_fecha(fechas.get("FechaPublicacion")),
        "fecha_cierre":       _parse_fecha(fechas.get("FechaCierre")),
        "fecha_adjudicacion": _parse_fecha(fechas.get("FechaAdjudicacion")),
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
            "nombre_producto":             _trunc(it.get("NombreProducto") or it.get("Producto")),
            "descripcion":                 _trunc(it.get("Descripcion")),
            "cantidad":                    _safe_float(it.get("Cantidad")),
            "unidad_medida":               _trunc(it.get("UnidadMedida"), 100),
            "precio_neto_unitario":        _safe_float(it.get("PrecioNeto")),
            "rut_proveedor_adjudicado":    adj.get("RutProveedor"),
            "nombre_proveedor_adjudicado": _trunc(adj.get("NombreProveedor"), 500),
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
    fechas = raw.get("Fechas", {}) or {}

    oc = {
        "codigo":            raw.get("Codigo"),
        "nombre":            raw.get("Nombre"),
        "estado":            _safe_int(raw.get("CodigoEstado")),
        "estado_texto":      ESTADO_OC.get(_safe_int(raw.get("CodigoEstado")), raw.get("Estado")),
        "total":             _safe_float(raw.get("Total")),
        "total_neto":        _safe_float(raw.get("TotalNeto")),
        # OC usa "TipoMoneda", no "Moneda"
        "unidad_monetaria":  raw.get("TipoMoneda") or raw.get("Moneda"),
        # Las fechas están bajo el objeto "Fechas", no en la raíz
        "fecha_creacion":    _parse_fecha(fechas.get("FechaCreacion")),
        "fecha_envio":       _parse_fecha(fechas.get("FechaEnvio")),
        "comprador_rut":     comp.get("RutUnidad"),
        "comprador_nombre":  comp.get("NombreOrganismo"),
        "comprador_region":  comp.get("RegionUnidad"),
        "comprador_comuna":  comp.get("ComunaUnidad"),
        "proveedor_rut":     prov.get("RutSucursal"),
        "proveedor_nombre":  prov.get("Nombre"),
        "proveedor_region":  prov.get("Region"),
        "proveedor_comuna":  prov.get("Comuna"),
        # Normalizar string vacío a None para evitar FK inválidas
        "licitacion_codigo": raw.get("CodigoLicitacion") or None,
        "raw_data":          raw,
    }

    items = []
    for it in items_raw:
        items.append({
            "orden_codigo":          oc["codigo"],
            "numero_linea":          _safe_int(it.get("Correlativo")),
            "nombre_producto":       _trunc(it.get("NombreProducto") or it.get("Producto")),
            "descripcion":           _trunc(it.get("Descripcion") or it.get("EspecificacionComprador")),
            "categoria":             _trunc(it.get("Categoria") or it.get("CodigoCategoria"), 500),
            "cantidad":              _safe_float(it.get("Cantidad")),
            "unidad_medida":         _trunc(it.get("UnidadMedida") or it.get("Unidad"), 100),
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
def upsert_batch(sb: Client, tabla: str, registros: list[dict], conflict_col: str,
                  chunk: int = CHUNK_MAIN) -> int:
    """Upsert en lotes de `chunk` registros. Retorna el total enviado."""
    if not registros:
        return 0
    # Deduplicar por conflict_col — la API a veces devuelve filas duplicadas
    # dentro del mismo día; sin esto Postgres lanza '21000: ON CONFLICT DO UPDATE
    # command cannot affect row a second time' y el batch entero se descarta.
    cols = [c.strip() for c in conflict_col.split(",")]
    seen: dict = {}
    for row in registros:
        key = tuple(row.get(c) for c in cols)
        seen[key] = row  # última ocurrencia gana
    registros = list(seen.values())
    total = 0
    for i in range(0, len(registros), chunk):
        lote = registros[i : i + chunk]
        try:
            sb.table(tabla).upsert(lote, on_conflict=conflict_col).execute()
            total += len(lote)
            log.debug(f"    upsert {len(lote)} → {tabla}")
        except Exception as e:
            log.error(f"    ERROR guardando en {tabla}: {e}")
    return total


def get_skip_codes(sb: Client, tabla: str, col_codigo: str, col_estado: str,
                   codigos: list[str], estados_finales: set[int]) -> tuple[set[str], set[str]]:
    """
    Consulta en batch el estado de los códigos en Supabase.
    Retorna (skip, actualizar):
      - skip:      existen en BD con estado final → no re-fetchear
      - actualizar: existen en BD con estado no-final → re-fetchear para capturar cambios
    Los códigos que no están en BD quedan fuera de ambos sets (son nuevos).
    """
    if not codigos:
        return set(), set()
    skip: set[str] = set()
    actualizar: set[str] = set()
    chunk_size = 300
    for i in range(0, len(codigos), chunk_size):
        chunk = codigos[i : i + chunk_size]
        res = sb.table(tabla).select(f"{col_codigo},{col_estado}").in_(col_codigo, chunk).execute()
        for row in (res.data or []):
            codigo = row[col_codigo]
            estado = row.get(col_estado)
            if estado in estados_finales:
                skip.add(codigo)
            else:
                actualizar.add(codigo)
    return skip, actualizar


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
            "updated_at":      datetime.now(timezone.utc).isoformat(),
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
        # Solo "completado" se saltea; "error", "parcial" y "pendiente" se reintenta
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

    total_dias  = (hoy - hasta).days + 1
    total_pares = total_dias * len(tipos)
    ya_hechos   = sum(
        1 for d in (hasta + timedelta(days=i) for i in range(total_dias))
        for t in tipos
        if (d.isoformat(), t) in completados
    )
    pendientes = len(cola)
    pct_done   = ya_hechos / total_pares * 100 if total_pares else 0
    log.info(f"  Historial {hasta} → {hoy}  ({total_pares:,} pares, {total_dias} días × {len(tipos)} tipos)")
    log.info(f"  [{_barra(ya_hechos, total_pares)}] {ya_hechos:,} completados ({pct_done:.1f}%) | {pendientes:,} pendientes")
    return cola


# ─────────────────────────────────────────────
# Lógica principal por día
# ─────────────────────────────────────────────
def procesar_dia_licitaciones(sb: Client, fecha: date, limiter: RateLimiter,
                               deadline: Optional[datetime] = None) -> int:
    fecha_str = fecha.strftime("%d%m%Y")
    t0 = datetime.now(timezone.utc)

    log_inicio(sb, fecha, "licitacion")
    req_inicio = limiter.total_used()

    codigos = get_codigos_por_fecha("licitacion", fecha_str, limiter)
    if codigos is None:
        # La API falló tras todos los reintentos — no sabemos si hay datos.
        # Se deja como "error" para que la próxima sesión lo reintente.
        log_fin(sb, fecha, "licitacion", "error", 0, 0, limiter.total_used() - req_inicio)
        log.warning("    API no respondió para esta fecha — se reintentará en la próxima sesión")
        return 0
    if not codigos:
        estado_final = "parcial" if fecha == date.today() else "completado"
        log_fin(sb, fecha, "licitacion", estado_final, 0, 0, limiter.total_used() - req_inicio)
        log.info("    Sin licitaciones en la API para esta fecha")
        return 0

    skip, actualizar = get_skip_codes(sb, "licitaciones", "codigo_externo", "estado",
                                       codigos, ESTADOS_FINALES_LIC)
    codigos_a_procesar = [c for c in codigos if c not in skip]
    n_nuevas = len(codigos) - len(skip) - len(actualizar)
    log.info(
        f"    API:{len(codigos):>5}  |  skip(final):{len(skip):>5}  |"
        f"  actualizar:{len(actualizar):>5}  |  nuevas:{n_nuevas:>5}  |"
        f"  a procesar:{len(codigos_a_procesar):>5}"
    )

    if not codigos_a_procesar:
        estado_final = "parcial" if fecha == date.today() else "completado"
        log_fin(sb, fecha, "licitacion", estado_final, len(codigos), 0, limiter.total_used() - req_inicio)
        log.info(f"    Nada nuevo — {_fmt_dur((datetime.now(timezone.utc) - t0).total_seconds())}")
        return 0

    licitaciones_batch, items_batch = [], []
    procesados  = 0
    total_a_proc = len(codigos_a_procesar)

    def _flush_parcial(motivo: str):
        upsert_batch(sb, "licitaciones",     licitaciones_batch, "codigo_externo",           chunk=CHUNK_MAIN)
        upsert_batch(sb, "items_licitacion", items_batch,        "licitacion_codigo,numero_linea", chunk=CHUNK_ITEMS)
        req_usados = limiter.total_used() - req_inicio
        log_fin(sb, fecha, "licitacion", "parcial", len(codigos), procesados, req_usados)
        log.warning(
            f"    PARCIAL ({motivo}) — {procesados}/{total_a_proc} guardadas"
            f" | {req_usados} req | {_fmt_dur((datetime.now(timezone.utc)-t0).total_seconds())}"
        )

    for idx, codigo in enumerate(codigos_a_procesar, 1):
        if limiter.remaining() < 5:
            _flush_parcial("requests agotados")
            return procesados
        if deadline and datetime.now(timezone.utc) >= deadline:
            _flush_parcial("límite de tiempo")
            raise TiempoAgotado()

        raw = get_detalle("licitacion", codigo, limiter)
        if not raw:
            continue

        licitacion, items = parse_licitacion(raw)
        if licitacion["codigo_externo"]:
            licitaciones_batch.append(licitacion)
            items_batch.extend(items)
            procesados += 1

        if len(licitaciones_batch) >= FLUSH_SIZE:
            upsert_batch(sb, "licitaciones",     licitaciones_batch, "codigo_externo",           chunk=CHUNK_MAIN)
            upsert_batch(sb, "items_licitacion", items_batch,        "licitacion_codigo,numero_linea", chunk=CHUNK_ITEMS)
            licitaciones_batch.clear()
            items_batch.clear()

        if idx % 25 == 0 or idx == total_a_proc:
            pct    = idx / total_a_proc * 100
            elap   = (datetime.now(timezone.utc) - t0).total_seconds()
            r_dia  = limiter.total_used() - req_inicio
            eta    = _fmt_dur((elap / idx) * (total_a_proc - idx)) if idx > 0 else "?"
            t_ses  = _fmt_dur((deadline - datetime.now(timezone.utc)).total_seconds()) if deadline else "∞"
            log.info(
                f"    [{_barra(idx, total_a_proc)}] {idx:>4}/{total_a_proc}"
                f" ({pct:5.1f}%) | guardadas:{procesados:>5} | req:{r_dia:>5}"
                f" | ETA día:{eta:>8} | sesión:{t_ses}"
            )

    upsert_batch(sb, "licitaciones",     licitaciones_batch, "codigo_externo",           chunk=CHUNK_MAIN)
    upsert_batch(sb, "items_licitacion", items_batch,        "licitacion_codigo,numero_linea", chunk=CHUNK_ITEMS)

    elapsed  = (datetime.now(timezone.utc) - t0).total_seconds()
    req_dia  = limiter.total_used() - req_inicio
    estado_final = "parcial" if fecha == date.today() else "completado"
    log_fin(sb, fecha, "licitacion", estado_final, len(codigos), procesados, req_dia)
    etiqueta = "PARCIAL(hoy)" if estado_final == "parcial" else "OK"
    log.info(
        f"    {etiqueta} — {procesados}/{total_a_proc} guardadas"
        f" | {len(skip)} skip | {req_dia} req | {_fmt_dur(elapsed)}"
    )
    return procesados


def procesar_dia_ordenes(sb: Client, fecha: date, limiter: RateLimiter,
                          deadline: Optional[datetime] = None) -> int:
    fecha_str = fecha.strftime("%d%m%Y")
    t0 = datetime.now(timezone.utc)

    log_inicio(sb, fecha, "orden_compra")
    req_inicio = limiter.total_used()

    codigos = get_codigos_por_fecha("orden_compra", fecha_str, limiter)
    if codigos is None:
        log_fin(sb, fecha, "orden_compra", "error", 0, 0, limiter.total_used() - req_inicio)
        log.warning("    API no respondió para esta fecha — se reintentará en la próxima sesión")
        return 0
    if not codigos:
        estado_final = "parcial" if fecha == date.today() else "completado"
        log_fin(sb, fecha, "orden_compra", estado_final, 0, 0, limiter.total_used() - req_inicio)
        log.info("    Sin órdenes en la API para esta fecha")
        return 0

    skip, actualizar = get_skip_codes(sb, "ordenes_compra", "codigo", "estado",
                                       codigos, ESTADOS_FINALES_OC)
    codigos_a_procesar = [c for c in codigos if c not in skip]
    n_nuevas = len(codigos) - len(skip) - len(actualizar)
    log.info(
        f"    API:{len(codigos):>5}  |  skip(final):{len(skip):>5}  |"
        f"  actualizar:{len(actualizar):>5}  |  nuevas:{n_nuevas:>5}  |"
        f"  a procesar:{len(codigos_a_procesar):>5}"
    )

    if not codigos_a_procesar:
        estado_final = "parcial" if fecha == date.today() else "completado"
        log_fin(sb, fecha, "orden_compra", estado_final, len(codigos), 0, limiter.total_used() - req_inicio)
        log.info(f"    Nada nuevo — {_fmt_dur((datetime.now(timezone.utc) - t0).total_seconds())}")
        return 0

    oc_batch, items_batch, compradores_batch, proveedores_batch = [], [], [], []
    procesados  = 0
    total_a_proc = len(codigos_a_procesar)
    compradores_vistos, proveedores_vistos = set(), set()

    def _flush_parcial(motivo: str):
        upsert_batch(sb, "compradores",        compradores_batch, "rut_unidad",                  chunk=CHUNK_ITEMS)
        upsert_batch(sb, "proveedores",        proveedores_batch, "rut_sucursal",                chunk=CHUNK_ITEMS)
        upsert_batch(sb, "ordenes_compra",     oc_batch,          "codigo",                      chunk=CHUNK_MAIN)
        upsert_batch(sb, "items_orden_compra", items_batch,       "orden_codigo,numero_linea",   chunk=CHUNK_ITEMS)
        req_usados = limiter.total_used() - req_inicio
        log_fin(sb, fecha, "orden_compra", "parcial", len(codigos), procesados, req_usados)
        log.warning(
            f"    PARCIAL ({motivo}) — {procesados}/{total_a_proc} guardadas"
            f" | {req_usados} req | {_fmt_dur((datetime.now(timezone.utc)-t0).total_seconds())}"
        )

    for idx, codigo in enumerate(codigos_a_procesar, 1):
        if limiter.remaining() < 5:
            _flush_parcial("requests agotados")
            return procesados
        if deadline and datetime.now(timezone.utc) >= deadline:
            _flush_parcial("límite de tiempo")
            raise TiempoAgotado()

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

        if len(oc_batch) >= FLUSH_SIZE:
            upsert_batch(sb, "compradores",        compradores_batch, "rut_unidad",                  chunk=CHUNK_ITEMS)
            upsert_batch(sb, "proveedores",        proveedores_batch, "rut_sucursal",                chunk=CHUNK_ITEMS)
            upsert_batch(sb, "ordenes_compra",     oc_batch,          "codigo",                      chunk=CHUNK_MAIN)
            upsert_batch(sb, "items_orden_compra", items_batch,       "orden_codigo,numero_linea",   chunk=CHUNK_ITEMS)
            oc_batch.clear(); items_batch.clear()
            compradores_batch.clear(); proveedores_batch.clear()

        if idx % 25 == 0 or idx == total_a_proc:
            pct   = idx / total_a_proc * 100
            elap  = (datetime.now(timezone.utc) - t0).total_seconds()
            r_dia = limiter.total_used() - req_inicio
            eta   = _fmt_dur((elap / idx) * (total_a_proc - idx)) if idx > 0 else "?"
            t_ses = _fmt_dur((deadline - datetime.now(timezone.utc)).total_seconds()) if deadline else "∞"
            log.info(
                f"    [{_barra(idx, total_a_proc)}] {idx:>4}/{total_a_proc}"
                f" ({pct:5.1f}%) | guardadas:{procesados:>5} | req:{r_dia:>5}"
                f" | ETA día:{eta:>8} | sesión:{t_ses}"
            )

    upsert_batch(sb, "compradores",        compradores_batch, "rut_unidad",                  chunk=CHUNK_ITEMS)
    upsert_batch(sb, "proveedores",        proveedores_batch, "rut_sucursal",                chunk=CHUNK_ITEMS)
    upsert_batch(sb, "ordenes_compra",     oc_batch,          "codigo",                      chunk=CHUNK_MAIN)
    upsert_batch(sb, "items_orden_compra", items_batch,       "orden_codigo,numero_linea",   chunk=CHUNK_ITEMS)

    elapsed  = (datetime.now(timezone.utc) - t0).total_seconds()
    req_dia  = limiter.total_used() - req_inicio
    estado_final = "parcial" if fecha == date.today() else "completado"
    log_fin(sb, fecha, "orden_compra", estado_final, len(codigos), procesados, req_dia)
    etiqueta = "PARCIAL(hoy)" if estado_final == "parcial" else "OK"
    log.info(
        f"    {etiqueta} — {procesados}/{total_a_proc} guardadas"
        f" | {len(skip)} skip | {req_dia} req | {_fmt_dur(elapsed)}"
    )
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
    deadline: Optional[datetime] = None,
):
    """Procesa una lista ordenada de (fecha, tipo) respetando el rate limit y el tiempo."""
    W     = 60
    total = len(cola)
    for i, (fecha, tipo) in enumerate(cola, 1):
        if limiter.remaining() < 5:
            log.warning("Requests agotados para esta sesión.")
            break
        if limiter.total_used() >= max_req:
            log.warning(f"Límite de sesión alcanzado ({max_req:,} requests). Deteniendo.")
            break
        if deadline and datetime.now(timezone.utc) >= deadline:
            log.warning(f"Límite de tiempo alcanzado antes de [{i}/{total}]. Deteniendo.")
            break

        t_ses  = _fmt_dur((deadline - datetime.now(timezone.utc)).total_seconds()) if deadline else "∞"
        label  = "LIC" if tipo == "licitacion" else " OC"
        pct_cola = (i - 1) / total * 100
        log.info(f"\n{'─' * W}")
        log.info(
            f"  [{_barra(i-1, total, 8)}] {i:>4}/{total} ({pct_cola:4.1f}%)"
            f"  {fecha.strftime('%d/%m/%Y')}  {label}"
        )
        log.info(
            f"  usados:{limiter.total_used():>7,} | restantes:{limiter.remaining():>7,}"
            f" | tiempo sesión: {t_ses}"
        )
        log.info(f"{'─' * W}")

        try:
            if tipo == "licitacion":
                procesar_dia_licitaciones(sb, fecha, limiter, deadline)
            else:
                procesar_dia_ordenes(sb, fecha, limiter, deadline)
        except TiempoAgotado:
            log.warning("Sesión detenida por límite de tiempo. Progreso guardado en extraccion_log.")
            break


def main():
    args = parse_args()

    if not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_ROLE_KEY no está configurada. Copia .env.example → .env")
        sys.exit(1)

    max_req       = args.max_requests or (MAX_REQUESTS_DAY * len(TICKETS))
    sb            = create_client(SUPABASE_URL, SUPABASE_KEY)
    limiter       = RateLimiter(TICKETS, MAX_REQUESTS_DAY)
    inicio_sesion = datetime.now(timezone.utc)
    deadline      = inicio_sesion + timedelta(seconds=SESSION_LIMIT_SECONDS)

    W = 60
    log.info("═" * W)
    log.info("  EXTRACTOR MERCADO PÚBLICO → SUPABASE")
    log.info("─" * W)
    log.info(f"  Modo:      {args.modo.upper():<10}  Solo: {args.solo or 'ambos'}")
    log.info(f"  Tickets:   {len(TICKETS)} configurados  (cap: {len(TICKETS)*MAX_REQUESTS_DAY:,} req/día)")
    log.info(f"  Max req:   {max_req:,}")
    log.info(f"  Inicio:    {inicio_sesion.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    log.info(f"  Deadline:  {deadline.strftime('%Y-%m-%d %H:%M:%S')} UTC  "
             f"({SESSION_LIMIT_SECONDS//3600}h {(SESSION_LIMIT_SECONDS%3600)//60}m)")
    log.info("═" * W)

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

            _procesar_cola(sb, limiter, cola, max_req, deadline)

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

            _procesar_cola(sb, limiter, cola, max_req, deadline)

    except RuntimeError as e:
        log.error(f"\n⚠️  {e}")
        sys.exit(1)

    elapsed_total = (datetime.now(timezone.utc) - inicio_sesion).total_seconds()
    log.info("\n" + "═" * W)
    log.info("  SESIÓN FINALIZADA")
    log.info("─" * W)
    log.info(f"  Tiempo total:    {_fmt_dur(elapsed_total)}")
    log.info(f"  Requests usados: {limiter.total_used():,} / {max_req:,}")
    for i, count in enumerate(limiter.counts):
        pct_t = count / MAX_REQUESTS_DAY * 100
        log.info(f"    Ticket {i+1}: {count:>6,} req  ({pct_t:.1f}% del límite diario)")
    log.info("═" * W)


if __name__ == "__main__":
    main()
