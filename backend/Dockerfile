FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY tsconfig.json ./
COPY src ./src

# Fazer o build
RUN npm run build

# Imagem final de produção
FROM node:20-alpine

WORKDIR /app

# Copiar package.json e dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar o build compilado
COPY --from=builder /app/dist ./dist

# Expor a porta que a API vai usar
EXPOSE 3333

# Comando para iniciar
CMD ["npm", "start"]
