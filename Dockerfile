# ---- Build stage ----
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runtime stage ----
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
WORKDIR /app

# Install tsx globally for running TypeScript workspace sources
RUN npm install -g tsx

# Copy workspace root
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy API source + dist
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src apps/api/src

# Copy built frontend
COPY --from=build /app/apps/web/dist apps/web/dist

# Copy db package (raw source — no build step)
COPY --from=build /app/packages/db/package.json packages/db/
COPY --from=build /app/packages/db/src packages/db/src

# Copy shared package (raw source — no build step)
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/shared/src packages/shared/src

# Install production deps
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3001
CMD ["tsx", "apps/api/src/index.ts"]
