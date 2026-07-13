/**
 * Crea (o actualiza) el primer militante con rol ADMIN, para poder entrar
 * al sistema por primera vez sin depender del auto-registro publico (que
 * ya no existe: el registro real es via formulario fisico + digitador).
 *
 * Uso (dentro del contenedor, en /app):
 *   node scripts/seed-admin.js <cedula> <password> [nombres] [apellidos] [telefono]
 *
 * Ejemplo:
 *   node scripts/seed-admin.js 00000000000 MiClaveSegura123 Admin Principal 8090000000
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const [, , cedula, password, nombres, apellidos, telefono] = process.argv;

  if (!cedula || !password) {
    console.error('Uso: node scripts/seed-admin.js <cedula> <password> [nombres] [apellidos] [telefono]');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.militante.upsert({
    where: { cedula },
    update: { passwordHash, rolGlobal: 'ADMIN', estado: 'VALIDADO' },
    create: {
      cedula,
      nombres: nombres || 'Admin',
      apellidos: apellidos || 'Principal',
      telefono: telefono || '00000000000',
      passwordHash,
      rolGlobal: 'ADMIN',
      estado: 'VALIDADO',
    },
  });

  console.log(`Listo. Militante ${admin.cedula} (${admin.nombres} ${admin.apellidos}) es ahora ADMIN.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error al crear el admin:', err.message);
  process.exit(1);
});
