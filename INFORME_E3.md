# Informe E3 — Licitapp

> **Cómo usar este documento:** es un borrador de referencia para trabajar con tus compañeros.
> Reemplaza todo lo que está marcado como `[ASÍ]` con datos reales. Las tasas de éxito, citas y
> puntajes SUS son ejemplos coherentes con el feedback recogido — ajústalos a lo que pasó realmente.

---

## Portada

- **Institución:** Pontificia Universidad Católica de Chile · Escuela de Ingeniería · IIC2182 Interfaces y Experiencia de Usuario
- **Proyecto:** Licitapp — Inteligencia territorial para el mercado público chileno
- **Entrega:** E3 — Validación con usuarios y proyecto final
- **Grupo:** `[NÚMERO DE GRUPO]`
- **Sección:** `[SECCIÓN]`
- **Integrantes:** `[INTEGRANTE 1]`, `[INTEGRANTE 2]`, `[INTEGRANTE 3]`
- **Repositorio:** `[URL GitHub]`
- **Deploy:** `[URL Vercel]`
- **Fecha:** Junio 2026

---

## 2. Resumen del proyecto

### 2.1 Problema y contexto
El mercado público chileno, centralizado en Mercado Público del Estado, mueve decenas de miles de
millones de pesos en órdenes de compra y licitaciones cada año. Sin embargo, los analistas, consultores
y proveedores que buscan oportunidades en este mercado deben navegar manualmente interfaces poco
amigables, sin capacidades de análisis territorial ni comparativo. No existe una herramienta que permita
visualizar dónde se concentra el gasto, quiénes son los proveedores dominantes en cada territorio, ni
qué patrones siguen los organismos compradores.

### 2.2 Usuario objetivo
El usuario primario de Licitapp es el **analista o consultor de mercado público**: una persona que
asesora a empresas —principalmente PYMES— en su estrategia de participación en el sector público. Su
trabajo involucra identificar qué licitaciones son relevantes para sus clientes, evaluar la competencia
y construir argumentos sobre dónde y cómo participar.

### 2.3 Propuesta de valor (VPC actualizado)

**Dolores (Pains):**
- Pérdida de tiempo revisando Mercado Público manualmente sin filtros inteligentes
- Imposibilidad de comparar el historial de adjudicaciones de un organismo comprador
- Sin visión territorial de dónde se concentran las oportunidades
- Falta de contexto competitivo al evaluar si vale la pena preparar una oferta

**Ganancias (Gains):**
- Vista unificada de licitaciones y OC filtradas por región, tipo y estado
- Identificación rápida del organismo comprador y su historial de gasto
- Análisis territorial para priorizar en qué regiones conviene operar
- Acceso al detalle de cada licitación para evaluar viabilidad de oferta

**Actualización respecto a E2:** A partir del user testing, se identificó que la propuesta de valor
original era correcta en dirección pero incompleta en su implementación: el producto entregaba análisis
territorial agregado, pero el usuario necesita además búsqueda y evaluación de oportunidades específicas.

---

## 3. Diseño del user testing

### 3.1 Participantes
Se realizaron sesiones individuales con **3 participantes** con perfiles mixtos, todos externos al
equipo del proyecto y representativos del usuario objetivo definido en E1:

| # | Perfil | Experiencia con Mercado Público | Modalidad |
|---|--------|--------------------------------|-----------|
| P1 | `[Ej: Estudiante Ing. Comercial, simula rol analista]` | Media — conoce el ecosistema pero no usa herramientas de análisis | Remota (Zoom, think-aloud) |
| P2 | `[Ej: Dueño de PYME de servicios IT]` | Baja — ha participado en 1–2 licitaciones como proveedor | Remota (Zoom, think-aloud) |
| P3 | `[Ej: Analista en empresa consultora]` | Alta — trabaja regularmente con datos de Mercado Público | Remota (Zoom, think-aloud) |

### 3.2 Método
Se utilizó **testing de usabilidad moderado con protocolo think-aloud**. El facilitador observó sin
intervenir salvo para aclarar la tarea si el participante se bloqueaba completamente. Cada sesión tuvo
una duración aproximada de 30 minutos: 5 minutos de introducción, 20 minutos de ejecución de tareas con
think-aloud, y 5 minutos de cuestionario SUS más preguntas abiertas.

### 3.3 Tareas del guión
El guión completo se incluye en el Anexo A. Las 4 tareas evaluadas fueron:

| Tarea | Enunciado | Objetivo de observación |
|-------|-----------|------------------------|
| T1 | "Tu cliente ofrece servicios de tecnología. Encuentra licitaciones activas que podrían ser relevantes para ellos." | ¿Puede el usuario buscar por categoría/rubro? ¿Qué ruta sigue? |
| T2 | "Quieres saber qué organismo público ha licitado más en tu región este año. Encuéntralo." | ¿Es intuitivo el flujo entre Dashboard y Licitaciones? |
| T3 | "Elige una licitación de la lista y determina si conviene que tu cliente prepare una propuesta." | ¿Qué información busca al evaluar una licitación? ¿Puede obtenerla? |
| T4 | "Usando el mapa, dime cuántas órdenes de compra hubo en tu comuna el último período." | ¿Es el mapa intuitivo como punto de entrada? |

### 3.4 Instrumento complementario
Al finalizar cada sesión se aplicó el **System Usability Scale (SUS)** estándar de 10 ítems en escala
Likert 1–5. El cuestionario utilizado se incluye en el Anexo B. Valores sobre 68 indican usabilidad
aceptable. Adicionalmente, se realizaron 4 preguntas abiertas post-sesión para capturar percepciones
generales.

---

## 4. Resultados y hallazgos

### 4.1 Tasas de éxito por tarea

| Tarea | P1 | P2 | P3 | Tasa de éxito |
|-------|----|----|----|---------------|
| T1 — Buscar por rubro | Parcial | No logró | Parcial | `[X/3]` |
| T2 — Top organismo por región | Logró | Parcial | Logró | `[X/3]` |
| T3 — Evaluar licitación específica | No logró | No logró | Parcial | `[X/3]` |
| T4 — Explorar mapa por comuna | Logró | Logró | Logró | `[X/3]` |
| **Puntaje SUS** | `[X]` | `[X]` | `[X]` | **Promedio: `[X.X]`** |

### 4.2 Hallazgos principales

**F1 — Falta de dirección: las vistas no guían al usuario**
Los tres participantes llegaron a la plataforma sin saber por dónde empezar. Las tres vistas (Mapa,
Dashboard, Licitaciones) son accesibles desde el menú, pero no existe una jerarquía de flujo que indique
cuál usar primero ni con qué propósito. Los participantes exploraron las tres vistas sin estrategia clara
y manifestaron sentirse desorientados.
> "`[Cita textual de un participante sobre la confusión inicial]`" — `[Perfil P1/P2/P3]`

**F2 — Redundancia entre vistas: datos similares sin diferenciación clara**
Las vistas de Dashboard y Licitaciones presentan datos similares (distribución por región, gráfico de
estados, tendencia mensual) con estructuras diferentes. Los participantes no tenían claro cuándo usar una
u otra. Dos participantes intentaron resolver la T2 alternando entre ambas vistas sin estar seguros de
cuál era la fuente correcta.

**F3 — La plataforma resuelve análisis agregado, pero el usuario necesita búsqueda específica**
Este es el hallazgo más estructural. La plataforma está construida para responder "¿cómo se distribuye el
gasto en mi región?" pero el usuario llega con una pregunta distinta: "¿hay alguna licitación relevante
para mi cliente?" o "¿vale la pena preparar una oferta para esta licitación?". No existe un flujo
orientado a la búsqueda por rubro, categoría o necesidad específica del proveedor.
> "`[Cita textual sobre no poder encontrar licitaciones de su rubro]`" — `[Perfil P1/P2/P3]`

**F4 — Las filas de tabla no son interactivas: expectativa incumplida**
En la tarea T3, los tres participantes intentaron hacer clic en una fila de licitación esperando ver más
detalles. Al no suceder nada, dos participantes lo intentaron nuevamente y concluyeron que "falta
información". La expectativa de que una fila de tabla sea clicable es consistente con convenciones de
aplicaciones similares.

**F5 — El mapa fue el elemento más intuitivo y valorado**
A pesar de los problemas en otras áreas, el mapa choropleth fue el componente mejor evaluado. Los tres
participantes completaron exitosamente la T4 y apreciaron la visualización territorial. Sin embargo,
señalaron que el mapa "está solo" y no conecta con las demás vistas.

### 4.3 Aciertos identificados
- La visualización geográfica por comuna es clara e interactiva
- Los KPI cards dan una lectura rápida del estado general del mercado
- Los filtros de la vista Licitaciones son valorados, aunque difíciles de descubrir
- El diseño visual fue bien evaluado: limpio, moderno y profesional

---

## 5. Plan de mejora

| # | Problema detectado | Severidad | Mejora propuesta | Justificación teórica | Estado |
|---|--------------------|-----------|------------------|----------------------|--------|
| P1 | Filas de licitaciones no son interactivas; el usuario no puede ver el detalle de una licitación específica (F4) | Alta | Panel lateral deslizante (drawer) con detalle completo de la licitación al hacer clic en una fila | Affordance e interacción esperada (Clase 11 — Interaction Design). Las filas con hover implican clicabilidad. | Implementada |
| P2 | La landing no comunica la propuesta de valor ni orienta al usuario nuevo sobre qué vista usar (F1) | Alta | Sección de 3 features en la landing que explican el pain/gain y conectan cada vista con la necesidad del usuario | Jerarquía visual y arquitectura de información (Clase 7 — UI Design I). | Implementada |
| P3 | Sin estados de carga en las vistas principales: el usuario no sabe si la app funciona durante la espera (F1) | Media | Pantallas de carga con skeletons animados para /dashboard, /licitaciones y /mapa | Visibilidad del estado del sistema — Heurística #1 de Nielsen (Clase 11). | Implementada |
| P4 | No existe búsqueda por rubro o categoría del proveedor; solo se filtra por tipo de licitación (F3) | Alta | Búsqueda protagonista + chips de rubro que reenmarcan el buscador hacia la necesidad del cliente | Modelo mental del usuario analista: su pregunta es "¿qué hay para mi rubro?" (Clase 11). | Implementada (parcial) |
| P5 | Redundancia entre Dashboard y Licitaciones: ambas vistas muestran datos similares sin diferenciación clara (F2) | Media | Diferenciar el propósito de cada vista con headers y subtítulos orientados a la pregunta que responden | Consistencia y estándares — Heurística #4 de Nielsen (Clase 7). | Implementada (parcial) |
| P6 | El mapa no conecta con el flujo de licitaciones; se percibe como sección aislada (F5) | Baja | Acciones cruzadas entre vistas (buscar organismo/proveedor desde el detalle) | Flujo de usuario continuo y reducción de puntos de quiebre (Clase 16). | Trabajo futuro |
| P7 | Ausencia de atributos ARIA en elementos interactivos | Media | aria-current, aria-label en selects, scope/aria-sort en tablas, aria-live en contadores | Diseño inclusivo: contenido perceptible y operable (Clase 17 — Accesibilidad). | Implementada |

> **Nota:** se priorizaron las mejoras de mayor impacto inmediato en la experiencia (P1–P4, P7) dado el
> tiempo disponible antes de esta entrega. La conexión profunda mapa↔licitaciones (P6) y una taxonomía
> de rubros completa (CPV) quedan como trabajo futuro.

---

## 6. Mejoras implementadas

> Ajusta esta sección a lo que finalmente quede en el código. Incluye capturas **antes/después** de cada una.

### 6.1 Mejora 1 — Panel de detalle (Drawer) en las tablas
- **Problema resuelto:** F4 — clicar una fila no hacía nada.
- **Antes:** las filas de licitaciones y órdenes tenían hover pero no eran clicables; no se podía ver el detalle sin salir de la app.
- **Después:** al hacer clic en cualquier fila se abre un panel lateral con el detalle completo (nombre, código, estado, tipo, monto, fechas, organismo/comuna). Se cierra con Escape, botón o clic fuera. Incluye acciones: copiar código, buscar más del mismo organismo/proveedor, y enlace a la ficha oficial en Mercado Público.
- **Conexión con el hallazgo:** responde a F4 y da el primer paso hacia F3.
- `[Captura: tabla con drawer abierto]`

### 6.2 Mejora 2 — Dirección del producto: landing + diferenciación de vistas
- **Problema resuelto:** F1 y F2 — falta de dirección y redundancia entre vistas.
- **Antes:** la landing era solo nombre + tagline + botón; Dashboard y Licitaciones se veían iguales.
- **Después:** la landing suma 3 feature-cards que explican para qué sirve cada vista, en lenguaje de la tarea del usuario. Cada vista declara su propósito en el header ("Análisis del mercado: ¿quién vende al Estado y cuánto?" vs "Oportunidades abiertas: ¿qué puede ofertar tu cliente?").
- **Justificación:** jerarquía visual centrada en el usuario (Clase 7); el punto de entrada comunica el modelo mental del producto.
- `[Captura: landing con cards]` · `[Captura: headers diferenciados]`

### 6.3 Mejora 3 — Búsqueda por rubro
- **Problema resuelto:** F3 — el usuario busca por rubro, no por región.
- **Antes:** el buscador estaba escondido en la cabecera de la tabla, con placeholder genérico.
- **Después:** buscador protagonista con placeholder orientado ("computadores, aseo, consultoría…") y chips de rubros comunes que filtran al instante.
- **Justificación:** alinea la interfaz con el modelo mental del analista (Clase 11).
- `[Captura: buscador + chips de rubro]`

### 6.4 Mejora 4 — Estados de carga y error
- **Problema resuelto:** F1 — pantalla en blanco durante la carga.
- **Antes:** al navegar entre páginas no había feedback durante el fetch.
- **Después:** skeletons animados (loading.tsx) en las 3 rutas que replican la estructura, y banner de error con "Reintentar" si la carga falla.
- **Justificación:** visibilidad del estado del sistema — Heurística #1 de Nielsen (Clase 11).
- `[Captura: skeleton de carga]`

### 6.5 Mejora 5 — Microinteracciones y accesibilidad
- **Después:** toasts de confirmación al copiar/limpiar filtros; `aria-current` en la navegación, `aria-sort` y `scope` en las tablas, `aria-label` en los filtros; filtros que ya no se comprimen en móvil.
- **Justificación:** feedback al usuario (Clase 11) y diseño inclusivo (Clase 17).

---

## 7. Valor entregado al usuario

**Dolor resuelto (Pain):** El analista no podía evaluar si una licitación era relevante para su cliente
sin abandonar Licitapp y buscar manualmente en Mercado Público. Con el drawer de detalle, ahora puede ver
el nombre completo, monto estimado, organismo comprador, fechas y tipo sin salir de la aplicación. Esto
comprime el tiempo de evaluación inicial de una oportunidad de minutos a segundos.

**Ganancia generada (Gain):** El analista ahora puede construir un criterio de filtrado eficiente antes de
comprometer tiempo en preparar una oferta. El flujo soportado es: Landing (entender el producto) →
Licitaciones (buscar por rubro + filtrar por región/estado) → Clic en fila (ver detalle) → Decisión
informada. Este flujo reduce la fricción del primer contacto y orienta al usuario hacia la tarea de valor.

**Conexión con E1:** En E1 el dolor identificado fue la falta de herramientas de análisis para el mercado
público chileno. El testing de E3 confirmó y refinó ese hallazgo: el dolor no es solo la falta de datos,
sino la falta de un flujo orientado a la toma de decisión del analista. Los datos ya estaban disponibles
en E2; lo que faltaba era el camino para llegar a la conclusión.

---

## 8. Reflexión y trabajo futuro

### 8.1 Aprendizajes del proceso iterativo
El hallazgo más valioso de esta entrega no fue técnico sino de dirección de producto: construimos una
herramienta de análisis territorial completa cuando el usuario necesitaba una herramienta de búsqueda y
evaluación de oportunidades. Ambas son válidas, pero sirven a momentos distintos del flujo de trabajo del
analista. Este desajuste no era visible en E2 porque no habíamos puesto el producto frente a usuarios con
tareas reales. La lección principal: el diseño iterativo no es solo pulir la interfaz, es validar que se
está resolviendo el problema correcto.

Adicionalmente, el proceso nos llevó a revisar conscientemente la interfaz en búsqueda de dark patterns.
Se verificó que la plataforma no presenta jerarquías visuales engañosas, textos ambiguos en botones de
acción ni mecanismos que induzcan a hacer clic en elementos que no corresponden a la intención del usuario.

### 8.2 Trabajo futuro
- **Taxonomía de rubros (CPV):** complementar la búsqueda por texto con categorías formales de Mercado Público.
- **Diferenciación más profunda de vistas:** consolidar o reorganizar Dashboard y Licitaciones según el momento del flujo del usuario.
- **Conexión mapa ↔ licitaciones:** navegar desde una comuna del mapa directo a sus licitaciones.
- **Accesibilidad completa:** extender ARIA a todos los componentes interactivos restantes.

---

## 9. Anexos

### Anexo A — Guión de user testing

**Introducción (script para el facilitador):**
> "Hola, gracias por participar. Vamos a explorar juntos una aplicación web llamada Licitapp, que busca
> ayudar a analistas y consultores a entender el mercado público chileno. Quiero aclarar que no estamos
> evaluando tu desempeño — estamos evaluando la aplicación. Si en algún momento algo no queda claro o no
> sabes qué hacer, eso es información útil para nosotros. Te pido que vayas pensando en voz alta mientras
> navegas: dime qué ves, qué intentas hacer y qué esperas que pase. ¿Tienes alguna pregunta antes de empezar?"

**Tarea 1:** "Imagina que asesoras a una empresa que ofrece servicios de tecnología e informática. Quieren
explorar si pueden ganar contratos con el sector público. Usando esta aplicación, encuentra licitaciones
activas que podrían ser relevantes para ellos."
*Criterio de éxito: el participante filtra o navega hasta ver licitaciones potencialmente relevantes para
servicios IT. Observar: ¿qué filtros usa? ¿intenta buscar por texto? ¿va al mapa o a Licitaciones primero?*

**Tarea 2:** "Tu cliente está pensando en focalizarse en la Región Metropolitana. Encuentra qué organismo
público ha licitado más (en número de licitaciones) en esa región durante el período disponible."
*Criterio de éxito: el participante encuentra el top organismo por licitaciones en RM. Observar: ¿usa
Dashboard o Licitaciones? ¿aplica el filtro de región?*

**Tarea 3:** "Elige cualquier licitación de la lista que te parezca interesante. Con la información
disponible en la aplicación, determina si conviene que tu cliente prepare una propuesta para esa licitación."
*Criterio de éxito: el participante accede al detalle de la licitación y revisa monto estimado, fechas y
organismo. Observar: ¿intenta hacer clic en la fila? ¿busca un botón de detalle?*

**Tarea 4:** "Imagina que tu cliente opera en `[nombre de una comuna]`. Usando el mapa, dime cuántas
órdenes de compra hubo en esa comuna durante el período disponible."
*Criterio de éxito: el participante navega al mapa, ubica la comuna y lee el dato. Observar: ¿el mapa es
intuitivo? ¿encuentra el panel de información?*

**Preguntas post-sesión:**
1. ¿Para qué crees que sirve esta aplicación? ¿A quién está dirigida?
2. ¿Hubo algún momento en que no supiste qué hacer? ¿Cuándo?
3. ¿Qué fue lo más útil? ¿Qué fue lo más confuso?
4. ¿Usarías esta herramienta en tu trabajo? ¿Por qué o por qué no?

### Anexo B — Cuestionario SUS (System Usability Scale)
*Escala: 1 = Completamente en desacuerdo — 5 = Completamente de acuerdo.*
*Puntaje: (suma ítems impares − 5) + (25 − suma ítems pares), todo × 2.5. Rango 0–100.*

| # | Ítem | P1 | P2 | P3 |
|---|------|----|----|----|
| 1 | Creo que me gustaría usar este sistema con frecuencia. | `[X]` | `[X]` | `[X]` |
| 2 | Encuentro el sistema innecesariamente complejo. | `[X]` | `[X]` | `[X]` |
| 3 | Pienso que el sistema es fácil de usar. | `[X]` | `[X]` | `[X]` |
| 4 | Necesitaría el apoyo de una persona técnica para usar este sistema. | `[X]` | `[X]` | `[X]` |
| 5 | Las funciones del sistema están bien integradas. | `[X]` | `[X]` | `[X]` |
| 6 | Pienso que hay demasiada inconsistencia en el sistema. | `[X]` | `[X]` | `[X]` |
| 7 | La mayoría de personas aprendería a usar este sistema rápidamente. | `[X]` | `[X]` | `[X]` |
| 8 | El sistema es muy complicado de usar. | `[X]` | `[X]` | `[X]` |
| 9 | Me sentí muy confiado/a usando el sistema. | `[X]` | `[X]` | `[X]` |
| 10 | Necesité aprender mucho antes de poder usar el sistema. | `[X]` | `[X]` | `[X]` |
| | **Puntaje SUS** | `[X]` | `[X]` | `[X]` |
