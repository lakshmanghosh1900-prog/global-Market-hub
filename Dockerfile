FROM node:20-alpine

RUN apk add --no-cache openssl
WORKDIR /app
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/global_market_hub

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "start"]
