# Halyk Pro — MVP

Платформа верифицированных юристов, адвокатов, бухгалтеров и налоговых консультантов внутри экосистемы Halyk Bank.

## Быстрый старт

```bash
npm install
cp .env.local .env.local.example  # заполни ключи
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

## Переменные окружения

Создай `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## База данных

Запусти `supabase-schema.sql` в Supabase SQL Editor.

## Customer Journey Map

```
/ (Halyk Bank mock)
  → /halyk-pro (выбор роли)
    → /client/category (тип специалиста)
      → /client/problem (тип задачи)
        → /client/ai-consult (AI-анализ)
          → /client/experts (список + AI-матчинг)
            → /client/experts/[id] (профиль)
              → /client/deal/new (подтверждение + эскроу)
                → /deal/[id] (чат)
                  → /deal/[id]/complete (Release Payment + отзыв)

  → /expert/dashboard (дашборд эксперта)
    → /expert/profile (профиль)
```

## Стек

- Next.js 16 + TailwindCSS v4
- Supabase (Auth + Database + Realtime)
- OpenAI GPT-4o-mini
- Vercel (деплой)
