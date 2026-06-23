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
RUN npx prisma generate && npm run build

# Runtime stage — full deps kept so `prisma migrate deploy` works on start
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
# migrate is idempotent and safe to run on every start; then launch Next
CMD ["sh","-c","npx prisma migrate deploy && npx next start -p 3000 -H 0.0.0.0"]
