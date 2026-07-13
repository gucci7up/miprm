-- El sistema real opera con formularios fisicos + digitadores que transcriben
-- los datos, no con auto-registro publico. Se agrega el rol DIGITADOR, que
-- puede registrar militantes y crear comites (pero no aprobar validaciones
-- ni ver estadisticas/exportar, eso sigue siendo exclusivo de ADMIN).
ALTER TYPE "RolGlobal" ADD VALUE 'DIGITADOR';
