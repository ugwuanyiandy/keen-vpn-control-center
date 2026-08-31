FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG DATABASE_URL=postgresql://keen:keen@db:5432/keenvpn?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npm run db:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/generated ./src/generated
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
