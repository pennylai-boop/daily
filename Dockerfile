# 天天 daily — Cloud Run 映像
# NEXT_PUBLIC_* 必須在建置期注入（ARG → ENV），執行期再設不會進 bundle。

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# .dockerignore 擋掉了 .env，所以這些值一定要從 --build-arg 進來，
# 沒帶就會編出一個空字串的 bundle（例如 LINE 登入會變成永遠「無法使用」）。
ARG NEXT_PUBLIC_SITE_URL=https://daily.introvista.ai
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ARG NEXT_PUBLIC_LIFF_ID=
ENV NEXT_PUBLIC_LIFF_ID=$NEXT_PUBLIC_LIFF_ID

# 沒帶這兩個，瀏覽器端的 getSupabaseBrowser() 一律回傳 null：LINE 登入表面上按得下去，
# 但 signInWithOAuth 之前就被擋掉（「這個環境還沒有設定 Supabase」），永遠不會真的登入。
ARG NEXT_PUBLIC_SUPABASE_URL=
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL

ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
