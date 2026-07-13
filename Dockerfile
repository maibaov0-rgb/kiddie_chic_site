# Build stage — install all deps, generate Prisma client, build Next.js
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* are inlined at build time
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
RUN npx prisma generate && npm run build && npm prune --production

# Runtime stage — only production files (much smaller image)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
# next start validates images.loaderFile from next.config at boot
COPY --from=build /app/lib/image-loader.ts ./lib/image-loader.ts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000
# migrate is idempotent and safe to run on every start; then launch Next
CMD ["sh","-c","npx prisma migrate deploy && npx next start -p 3000 -H 0.0.0.0"]
