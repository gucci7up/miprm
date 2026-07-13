FROM node:24-slim

# openssl es requerido por el motor de Prisma en Debian.
# python3/make/g++ son fallback por si bcrypt no encuentra un binario
# prebuilt para esta combinacion exacta de plataforma/version de Node.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Genera el cliente de Prisma y luego quita las devDependencies
# (prisma CLI, jest, nodemon, etc.) del node_modules final.
RUN npx prisma generate && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
