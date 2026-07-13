-- El comite se crea primero (nombre + municipio); el presidente se asigna
-- despues en una accion separada, igual que el patron de "coordinador" del
-- sistema de referencia (comites2028).
ALTER TABLE "comites_afectivos" ALTER COLUMN "presidenteId" DROP NOT NULL;
