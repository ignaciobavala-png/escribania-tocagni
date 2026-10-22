-- Categoría del documento dentro del expediente (clave de src/data/expediente.ts).
-- NULL = sin clasificar; el panel lo muestra como "Otros".
ALTER TABLE documentos ADD COLUMN categoria TEXT;
CREATE INDEX documentos_ficha ON documentos (ficha_id, categoria);
