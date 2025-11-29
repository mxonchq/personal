# personal

Простая статическая страница для работы с журналом тренировок.

## Возможности
- Поиск по тексту заметок с использованием mini-lunr (при наличии) или простого `includes`.
- Фильтрация по каналу и диапазону дат.
- Быстрые сохранённые фильтры: неделя, месяц, год.
- Страница «Статистика» с выбором канала и дат, графики по калориям, дистанции и времени.

## Запуск
Откройте `index.html` в браузере или поднимите локальный сервер, чтобы убедиться, что загрузка `data/entries.json` проходит без ограничений CORS.
Набор простых моделей и хелперов для фиксации тренировок и вычисления личной статистики по каналу «Спорт».

## Основные элементы
- `WorkoutBlock` — пресет вокруг `MetricsBlock` с упражнениями (время, дистанция, калории, темп, список упражнений).
- `compute_sport_records` — вычисляет персональные рекорды по весу, повторам, дистанции и скорости.
- `build_sport_stats` — собирает виджет статистики: суммарные калории/км за период и личные рекорды.

## Тесты
```bash
python -m pytest
```
# Personal PWA starter

This repository tracks a Next.js PWA starter that replaces an older Dexie/IndexedDB DAO experiment. It uses TypeScript and Tailwind CSS, ships with a sidebar shell layout, a light/dark theme toggle, and a custom PWA setup (manifest plus a service worker that caches core routes for offline support).

## Getting started

1. Install dependencies (Node 20+):
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build && npm run start
   ```

## PWA

- Manifest lives at `public/manifest.webmanifest` with text-based SVG icons (`icon-192.svg`, `icon-512.svg`) to avoid binary assets in the repository.
- The service worker in `public/sw.js` pre-caches `/`, `/pwa`, `/settings`, and the manifest, then caches subsequent GET requests.
- Registration occurs automatically on the client via `ServiceWorkerRegister` when running on HTTPS or localhost.

## Theming & layout

- `ThemeProvider` manages light/dark mode and persists the choice in `localStorage` while respecting `prefers-color-scheme`.
- Layout primitives live under `components/layout` with a sidebar, header, and content area ready for additional routes within `app/`.
- Fonts are loaded via `next/font` (Inter + Space Grotesk) and exposed as CSS variables for Tailwind.
