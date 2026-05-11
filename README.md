# Social Zeka AI

Premium flört ve sosyal zekâ analiz uygulaması için monorepo.

## Yapı

```
/apps
  /web      Next.js web uygulaması
  /mobile   Expo mobil uygulaması
  /backend  Fastify API
/packages
  /ai-engine  LLM orkestrasyonu + analiz motorları
  /ui         Ortak UI bileşenleri
  /types      Ortak TypeScript tipleri
  /utils      Yardımcı fonksiyonlar
```

## Geliştirme

1. Bağımlılıkları kur:

```
npm install
```

2. Backend için örnek env dosyasını hazırlayın:

```
cp apps/backend/.env.example apps/backend/.env
```

3. Uygulamaları çalıştır:

```
npm run dev         # web
npm run dev:backend # backend
npm run dev:mobile  # mobile
```

## Veritabanı

Supabase/PostgreSQL şeması: `apps/backend/sql/schema.sql`.
