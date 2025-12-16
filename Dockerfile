# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json* ./
COPY website/package.json ./website/

# Install dependencies for both root and website
# We use npm ci for deterministic installs
RUN npm ci
# We need to install website deps too
cd website && npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/website/node_modules ./website/node_modules
COPY . .

# Build the website
# root package.json has a "build" script that usually runs tsc, but we want to build the website
# so we run the build command inside the website directory
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app/website
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# We need the engine source code available for the API routes
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder /app/website/public ./website/public
COPY --from=builder --chown=nextjs:nodejs /app/website/.next/standalone ./website/
COPY --from=builder --chown=nextjs:nodejs /app/website/.next/static ./website/.next/static

# Switch to website directory as that's where the standalone server expects to run relative to
WORKDIR /app/website

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Run the Next.js server
CMD ["node", "server.js"]
