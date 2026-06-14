# ─── Base ───────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# ─── Install dependencies ──────────────────────────────
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ─── Build ─────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run typecheck

# ─── Production ────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun-install

# Copy source (Bun runs TypeScript directly)
COPY --from=build /app/src ./src
COPY --from=build /app/docs ./docs
COPY --from=build /app/tsconfig.json ./

EXPOSE 3000

CMD ["bun", "src/index.ts"]
