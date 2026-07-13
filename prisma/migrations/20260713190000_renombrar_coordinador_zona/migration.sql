-- Los roles y el nombre "presidente" no coinciden con la terminologia real
-- usada por la organizacion (Coordinador/Enlace/Miembro, ver plantilla de
-- impresion fisica). Se renombran para evitar confusion entre el sistema
-- y los formularios/impresiones reales.
ALTER TYPE "RolComite" RENAME VALUE 'PRESIDENTE' TO 'COORDINADOR';
ALTER TYPE "RolComite" RENAME VALUE 'SECRETARIO' TO 'ENLACE';

ALTER TABLE "comites_afectivos" RENAME COLUMN "presidenteId" TO "coordinadorId";

-- Nuevo campo Zona (ademas de provincia/municipio), copiado del catalogo
-- Zona del padron externo al momento de crear/editar el comite.
ALTER TABLE "comites_afectivos" ADD COLUMN "zonaId" TEXT;
ALTER TABLE "comites_afectivos" ADD COLUMN "zonaNombre" TEXT;
