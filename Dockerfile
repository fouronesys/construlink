FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/public ./public

ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "dist/index.js"]
