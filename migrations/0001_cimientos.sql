-- Esquema base del entorno interno (/admin). Ver docs/plan-automatizacion.md.
-- Fechas en ISO 8601 (texto UTC); los ids son texto (uuid) para poder
-- generarlos en el Worker sin depender del autoincrement.

-- Quién puede entrar al panel y con qué rol. La identidad la valida
-- Cloudflare Access; esta tabla solo decide qué ve cada persona.
CREATE TABLE usuarios (
  email  TEXT PRIMARY KEY,
  nombre TEXT,
  rol    TEXT NOT NULL CHECK (rol IN ('escribana', 'recepcion')),
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Una consulta o trámite. Nace del chat o de carga manual.
CREATE TABLE fichas (
  id        TEXT PRIMARY KEY,
  creada    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  nombre    TEXT,
  contacto  TEXT,
  servicio  TEXT,                 -- número del servicio ('01'..'09'), ver data/servicios.ts
  urgencia  TEXT NOT NULL DEFAULT 'normal' CHECK (urgencia IN ('baja', 'normal', 'alta')),
  estado    TEXT NOT NULL DEFAULT 'nueva'
              CHECK (estado IN ('nueva', 'en_curso', 'esperando_documentacion', 'cerrada')),
  resumen   TEXT,
  origen    TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('chat', 'manual', 'excel'))
);
CREATE INDEX fichas_estado ON fichas (estado, creada);

CREATE TABLE turnos (
  id       TEXT PRIMARY KEY,
  ficha_id TEXT REFERENCES fichas (id),
  inicio   TEXT NOT NULL,
  fin      TEXT,
  motivo   TEXT,
  estado   TEXT NOT NULL DEFAULT 'pendiente'
             CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'realizado'))
);
CREATE INDEX turnos_inicio ON turnos (inicio);

-- Plazos que no se pueden pasar: certificados registrales, libros, mandatos.
CREATE TABLE vencimientos (
  id       TEXT PRIMARY KEY,
  ficha_id TEXT REFERENCES fichas (id),
  concepto TEXT NOT NULL,
  vence    TEXT NOT NULL,         -- fecha YYYY-MM-DD
  estado   TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'resuelto'))
);
CREATE INDEX vencimientos_vence ON vencimientos (estado, vence);

-- Metadatos del PDF comprimido; el archivo vive en R2 bajo `clave_r2`.
CREATE TABLE documentos (
  id        TEXT PRIMARY KEY,
  ficha_id  TEXT REFERENCES fichas (id),
  tipo      TEXT,
  nombre    TEXT NOT NULL,
  clave_r2  TEXT NOT NULL,
  bytes     INTEGER,
  subido    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  vence     TEXT
);

-- Qué pasó, cuándo y a pedido de quién. Solo se agrega, nunca se edita.
CREATE TABLE auditoria (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  cuando  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actor   TEXT NOT NULL,          -- email, 'agente' o 'sistema'
  accion  TEXT NOT NULL,
  entidad TEXT,
  ref     TEXT,
  detalle TEXT                    -- JSON
);
CREATE INDEX auditoria_cuando ON auditoria (cuando);
