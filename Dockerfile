FROM node:20-alpine

RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/global_market_hub

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
