-- Regla de negocio: un militante puede presidir multiples comites, pero
-- solo puede pertenecer con rol Secretario o Miembro a UN comite adicional
-- en total. Esto ya se valida en el backend (ver comiteMiembro.service.js);
-- este indice unico parcial es una segunda linea de defensa a nivel de BD
-- contra condiciones de carrera (dos requests simultaneas).
CREATE UNIQUE INDEX "comite_miembros_un_adicional_por_militante"
ON "comite_miembros" ("militanteId")
WHERE "rol" IN ('SECRETARIO', 'MIEMBRO');
