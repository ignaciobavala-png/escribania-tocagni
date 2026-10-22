# Plan de automatización con IA — Escribanía Tocagni

> Rama: `automatizacion`. Documento de planificación: **todavía no hay código**.
> Estado: borrador para revisar con Inés Tocagni. Última edición: 2026-10-22.

## Estado al 2026-10-22

**Hecho (solo local, nada deployado):** cimientos (D1, auditoría, login con
Access validado en el middleware), panel PWA con dictado, consultas con estados
y vencimientos, flujo chat → ficha → mail al estudio (el modelo no ve datos
personales), importar/exportar Excel. Recursos ya creados en Cloudflare: base D1
migrada, Email Sending habilitado para `escribaniatocagni.com`, usuarios
`desarrollador` y `recepcion` cargados.

**Falta para deployar:** crear la app de Access (`/admin*`, `/api/admin*`) y
cargar `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` en `wrangler.jsonc`; cargar el
usuario de Inés; probar el mail real y la voz en un celular (iPhone incluido);
que Inés apruebe el texto de privacidad del formulario del chat.

**Siguiente:** resumen diario por mail (cron) y, con una planilla real del
estudio, ajustar los sinónimos de columnas del importador.

## 1. Objetivo

Inés dio el visto bueno para automatizar con IA. El sitio ya tiene un asistente
(chatbot sobre DeepSeek). La idea es darle un **entorno de trabajo interno**
(`/admin`) donde el mismo agente ayude a Inés y a la recepcionista a gestionar
consultas, turnos, vencimientos y documentos.

Principio rector: **la IA ordena, avisa y prepara; el criterio jurídico sigue
siendo de la escribana.** No redacta ni modifica actos.

## 2. Dolores que atacamos

Inferidos de los 9 servicios y las 10 FAQ del sitio (a validar con Inés):

1. Las mismas consultas se repiten (costo, documentación, quién elige escribano).
2. Los trámites se frenan por documentación que falta.
3. Los plazos se pasan (certificados registrales, libros de sociedades, mandatos).
4. Los turnos requieren coordinación manual (la atención es con turno previo).
5. Los presupuestos se arman a mano, uno por uno.
6. Los clientes recurrentes (sociedades) se olvidan: nadie los contacta antes del vencimiento.
7. La carga de datos de comparecientes es repetitiva y propensa a error.

## 3. Alcance de la fase 1

### A. Recepción inteligente

El chat de la web clasifica la consulta (tipo de acto, urgencia), pide nombre y
contacto, crea una **ficha** en el dashboard y avisa al estudio por mail. Al
cliente le envía una **lista de documentación** según el acto.
El contenido de las listas sale de `servicios.ts` y `faqs.ts` (textos de Inés).

### B. Resumen diario y semáforo de vencimientos

Cada mañana, un mail con: consultas nuevas, turnos del día, trámites esperando
documentación y vencimientos próximos. El dashboard muestra lo mismo en
rojo / amarillo / verde.

### C. Presupuesto orientativo (queda para después)

Necesita los aranceles reales de Inés, cargados en una **tabla editable** (no en
el código: impuestos y tasas cambian).

### Funciones transversales

- **Excel**: importar y exportar `.xlsx` en cada tabla, con vista previa antes de guardar.
- **PDF**: se comprime **en el navegador** (renderizado a WebP/JPEG y reempaquetado), se guarda en R2 con miniatura y metadatos. **No se lee el contenido.** El original se conserva de forma opcional, por tipo de documento.
- **Voz**: dictado con Whisper (Workers AI). La voz del asistente queda fuera de la fase 1.
- **UI dinámica**: catálogo cerrado de componentes (agenda, ficha, checklist, calculadora). El modelo elige cuál mostrar; los permisos los controla el código.

## 4. Arquitectura

Todo en el mismo Worker de Cloudflare. El sitio público sigue pre-renderizado;
`/admin/*` y las rutas de API son on-demand, igual que `/api/chat`.

| Pieza | Uso |
|---|---|
| D1 (SQLite) | Clientes, fichas, turnos, vencimientos, usuarios, aranceles, auditoría |
| R2 | PDFs y documentos (privado, enlaces firmados temporales) |
| Cron Triggers | Resumen diario, revisión de vencimientos |
| Queues / Workflows | Tareas con reintentos (lotes de mails) |
| Cloudflare Email Sending | Salida de mails desde el Worker con un binding `send_email` (sin API key ni servicio externo). Requiere incorporar el dominio `escribaniatocagni.com` |
| Workers AI | Transcripción de voz (Whisper) |
| Cloudflare Access | Login del dashboard (código por mail) |
| AI SDK + DeepSeek | El agente (el mismo del chatbot actual) |

### Dos capas de abstracción, a propósito

- **Notificaciones**: un solo punto de salida ("avisar al estudio que pasó X"). Hoy el canal es Cloudflare Email Sending; WhatsApp se suma después sin tocar el resto.
- **Fuentes de entrada**: subida manual, Excel, y más adelante Drive, Calendar y Gmail, todo convertido al mismo modelo (ficha, documento con metadatos, evento con fecha).

### El agente trabaja con herramientas acotadas

No tiene acceso libre a la base. Solo puede ejecutar herramientas definidas
(`crear_ficha`, `buscar_ficha`, `crear_turno`, `adjuntar_documento`, etc.), cada
una con su nivel de autonomía.

### "24/7"

No hay un proceso corriendo todo el día. El Worker se activa por tres
disparadores: **eventos** (llega una consulta), **horarios** (cron) y
**alarmas** puntuales ("avisame el viernes a las 9"). Entre disparadores no hace
nada por su cuenta.

## 5. Niveles de autonomía

| Nivel | Qué hace | Ejemplos |
|---|---|---|
| **Libre** | Actúa y deja registro | Resumen diario al estudio, aviso de consulta nueva, recordatorio de vencimiento a Inés |
| **Con aprobación** | Prepara y espera el "ok" de Inés o la recepcionista | Mail a cliente pidiendo documentación, confirmación de turno, presupuesto |
| **Prohibido** | Nunca | Redactar o modificar actos, dar asesoramiento legal, borrar fichas, enviar datos sensibles |

Todo lo que sale hacia un cliente **pasa por aprobación** al principio y se va
liberando por tipo de mensaje. Cada acción queda en el registro de auditoría
(qué, cuándo, a pedido de quién).

## 6. Privacidad y secreto profesional

- DeepSeek procesa en servidores fuera del país. Decisión de Inés, con conocimiento de causa: **la IA no recibe datos identificatorios** (anonimización previa) o se cambia de proveedor (es una línea en el AI SDK).
- Los PDF no se mandan a ninguna IA; se comprimen y guardan.
- Audio con Workers AI queda dentro de Cloudflare.
- WhatsApp vía API de Meta no conserva el cifrado de extremo a extremo: por ese canal circula gestión, no contenido de documentos.
- Conservación y borrado de datos: **pendiente**, depende de obligaciones del notariado que Inés conoce.

## 7. Fases posteriores

### Fase 2: fuentes de Google

Orden sugerido: **Calendar** → **Drive** → **Gmail**. Search Console es
independiente (informe mensual de cómo la encuentra la gente).

- La ficha **apunta** al archivo de Drive; no se duplica en R2.
- Solo lectura al principio. Cron cada 10–15 minutos, sin tiempo real.
- Gmail: lectura **acotada** (etiqueta específica o remitentes autorizados), nunca toda la casilla.
- A verificar: los permisos "restringidos" de Google exigen verificación formal para apps públicas, y en modo de prueba los tokens vencen a los 7 días. Con **Google Workspace** (dominio propio) la app puede ser interna y evita ambos problemas.

### Fase 3: WhatsApp

Cloud API de Meta, con número propio para el asistente, lista blanca de números
(Inés y la recepcionista) y webhook en el Worker.

- Fase de prueba con el número de prueba de Meta (hasta 5 destinatarios), sin número real.
- Ventana de 24 horas: para hablarles primero hace falta plantilla aprobada (o el resumen sigue por mail).
- A probar primero: el formato de números argentinos (el `9` después del `54`).
- Descartado: librerías no oficiales (riesgo de bloqueo del número) e intermediarios.

### Otras ideas, con más riesgo

Pre-carga de comparecientes, borradores asistidos y debida diligencia UIF.
Manejan datos sensibles o contenido jurídico: solo tras resolver la política de privacidad.

## 8. Modo observación

Durante la prueba de unos días, cada mensaje y cada cosa que el asistente no
supo resolver queda registrada. Ese registro reemplaza al cuestionario previo y
dicta qué se construye después.

## 9. Orden de trabajo

1. Cimientos: D1, R2, `/admin` con login, esquema base, auditoría.
2. Capa de notificaciones + Cloudflare Email Sending (con el dominio incorporado y SPF/DKIM/DMARC).
3. Primer flujo de punta a punta: consulta del chat → ficha → mail al estudio.
4. Resumen diario y semáforo de vencimientos.
5. Excel (importar/exportar) y subida de PDF.
6. Dictado por voz y UI dinámica con catálogo cerrado.
7. Prueba con Inés y la recepcionista (modo observación).

**Riesgo técnico a validar temprano:** la compresión de PDF en el navegador con
escaneos reales (poder, DNI, escritura), antes de diseñar alrededor.

## 10. Decisiones abiertas

- Privacidad con DeepSeek: ¿qué datos puede ver el modelo?
- Roles: ¿la recepcionista tiene los mismos permisos que Inés (por ejemplo, ver honorarios)?
- Documentos: ¿qué tipos se conservan en original y por cuánto tiempo?
- Agenda: ¿qué usa hoy el estudio (papel, Google Calendar, otro)?
- Google: ¿Workspace con dominio propio o Gmail personal?
- Login: Cloudflare Access (recomendado) o pantalla propia.

## 11. Preguntas para Inés (15 minutos)

1. ¿Qué consulta o trámite le llega más veces por semana?
2. ¿Qué es lo que más le roba tiempo? ¿Qué le da miedo olvidarse?
3. ¿Cómo lleva hoy los plazos y certificados? (Excel, agenda, de memoria)
4. ¿Cómo arma un presupuesto y de qué depende? ¿Puede pasarnos sus aranceles?
5. ¿Cuántos mails y WhatsApp recibe por día y cuántos son información básica?
6. ¿Está cómoda con que la IA vea datos de clientes, o prefiere solo datos anonimizados?
7. ¿Quién más va a usar el dashboard?
8. ¿Qué tipos de documento conserva en original y por cuánto tiempo?
9. ¿Usan Google Workspace con dominio propio o Gmail personal? ¿Dónde guardan hoy documentos y agenda?

## 12. Cambios al proyecto cuando arranque la implementación

- `CLAUDE.md` debe reflejar que `/admin` y sus APIs son rutas on-demand y que ya no es solo landing.
- El "casi 0 JS en el cliente" aplica al sitio público; el dashboard es otra superficie.
- Nuevos bindings en `wrangler.jsonc` (D1, R2, cron, `send_email`). Sin secreto nuevo para el mail: el binding reemplaza la API key. Recordar rebuildear tras tocar `wrangler.jsonc`.

### Por qué Cloudflare Email Sending y no Resend

El volumen es mínimo (avisos al estudio y algún mail puntual a un cliente con
turno), así que no justifica un proveedor aparte. Con el binding: una cuenta
menos, ninguna API key que rotar o filtrar, y los datos del cliente no pasan
por un tercero más. Confirmado en la documentación: el límite es de 50
destinatarios por mensaje y 5 MiB; la cuota diaria de cuentas nuevas es
conservadora y sube sola. Es un producto joven: se prueba temprano con el
dominio real y, si fallara, la capa de notificaciones permite volver a Resend
cambiando un solo archivo.
