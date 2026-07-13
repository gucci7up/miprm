-- CreateEnum
CREATE TYPE "EstadoMilitante" AS ENUM ('REGISTRADO', 'PENDIENTE_VALIDACION', 'VALIDADO');

-- CreateEnum
CREATE TYPE "RolComite" AS ENUM ('PRESIDENTE', 'SECRETARIO', 'MIEMBRO');

-- CreateEnum
CREATE TYPE "EstadoValidacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "RolGlobal" AS ENUM ('MILITANTE', 'ADMIN');

-- CreateTable
CREATE TABLE "militantes" (
    "id" SERIAL NOT NULL,
    "cedula" VARCHAR(11) NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "alias" TEXT,
    "rolGlobal" "RolGlobal" NOT NULL DEFAULT 'MILITANTE',
    "telefono" TEXT NOT NULL,
    "whatsapp" TEXT,
    "motivacion" TEXT,
    "email" TEXT,
    "emailConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "calle" TEXT,
    "numeroCasa" TEXT,
    "sector" TEXT,
    "contactoNombre" TEXT,
    "contactoTelefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "estado" "EstadoMilitante" NOT NULL DEFAULT 'REGISTRADO',
    "fechaNacimiento" DATE,
    "registradoPorId" INTEGER,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "militantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comites_afectivos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipioId" INTEGER NOT NULL,
    "municipioNombre" TEXT NOT NULL,
    "provinciaNombre" TEXT,
    "logo" BYTEA,
    "logoMimeType" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "presidenteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comites_afectivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comite_miembros" (
    "id" SERIAL NOT NULL,
    "comiteId" INTEGER NOT NULL,
    "militanteId" INTEGER NOT NULL,
    "rol" "RolComite" NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comite_miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comite_actividades" (
    "id" SERIAL NOT NULL,
    "comiteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "imagen" BYTEA,
    "imagenMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comite_actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones_identidad" (
    "id" SERIAL NOT NULL,
    "militanteId" INTEGER NOT NULL,
    "fotoCedulaFrente" BYTEA NOT NULL,
    "fotoCedulaFrenteMimeType" TEXT NOT NULL,
    "fotoCedulaDorso" BYTEA NOT NULL,
    "fotoCedulaDorsoMimeType" TEXT NOT NULL,
    "selfie" BYTEA NOT NULL,
    "selfieMimeType" TEXT NOT NULL,
    "estado" "EstadoValidacion" NOT NULL DEFAULT 'PENDIENTE',
    "revisadoPorAdmin" TEXT,
    "comentario" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaResolucion" TIMESTAMP(3),

    CONSTRAINT "validaciones_identidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "militantes_cedula_key" ON "militantes"("cedula");

-- CreateIndex
CREATE INDEX "comites_afectivos_municipioId_idx" ON "comites_afectivos"("municipioId");

-- CreateIndex
CREATE UNIQUE INDEX "comite_miembros_comiteId_militanteId_key" ON "comite_miembros"("comiteId", "militanteId");

-- AddForeignKey
ALTER TABLE "militantes" ADD CONSTRAINT "militantes_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "militantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comites_afectivos" ADD CONSTRAINT "comites_afectivos_presidenteId_fkey" FOREIGN KEY ("presidenteId") REFERENCES "militantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comite_miembros" ADD CONSTRAINT "comite_miembros_comiteId_fkey" FOREIGN KEY ("comiteId") REFERENCES "comites_afectivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comite_miembros" ADD CONSTRAINT "comite_miembros_militanteId_fkey" FOREIGN KEY ("militanteId") REFERENCES "militantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comite_actividades" ADD CONSTRAINT "comite_actividades_comiteId_fkey" FOREIGN KEY ("comiteId") REFERENCES "comites_afectivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_identidad" ADD CONSTRAINT "validaciones_identidad_militanteId_fkey" FOREIGN KEY ("militanteId") REFERENCES "militantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
