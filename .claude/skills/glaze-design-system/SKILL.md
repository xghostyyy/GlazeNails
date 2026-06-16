---
name: glaze-design-system
description: Дизайн-токены, шрифты, анимации и правила UI для студии Glaze
---

## Палитра (CSS-переменные в globals.css)

```css
--porcelain: #FAF6F3;   /* фон — тёплый молочный */
--petal: #F6D8DE;        /* розовый лепесток */
--lilac-haze: #DCC9E8;  /* дымчатая лаванда */
--mocha: #5E4F4B;        /* основной текст (вместо чёрного) */
--champagne: #E7C9A0;   /* золотисто-шампань акцент */
/* Pearl gradient (signature): lilac-haze → petal → champagne */
```

Никогда: дефолтный кремовый + Playfair + терракота. Это «AI-default» — брендовая катастрофа.

## Типографика

- Display (H1/H2): **Fraunces** — подключать через next/font, weight 400/600, только крупные заголовки
- Body/UI: **General Sans** (primary) или Inter (fallback) — weight 400/500
- Labels/Caption: тот же body, `tracking-widest uppercase text-xs`
- Типошкала жёсткая: `text-xs / sm / base / lg / xl / 2xl / 3xl / 4xl / 5xl`

## Signature-элементы

1. **Глянцевый пикер времени**: слоты — перламутровые chip-капли; `:hover` → `box-shadow: 0 0 12px rgba(220,201,232,0.6)`; `transform: translateY(-1px)`
2. **Mesh-gradient hero**: анимированный `background: conic-gradient(…)` с subtle parallax на mousemove
3. **Карточки мастеров/услуг**: `:hover` → `translateY(-4px) + shadow-lg`; не более 200ms ease-out

## Анимации (Motion)

```ts
// Строго orchestrated, не разбросанные
const fadeRise = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
// Scroll-triggered секции: viewport={{ once: true, amount: 0.2 }}
```

**Правила:**
- Все анимации уважают `prefers-reduced-motion`: оборачивай в `useReducedMotion()` или `motion.div` с `initial={false}` в reduced mode
- Не более 3 одновременных анимаций на экране
- Page-load reveal только на hero; остальное — scroll-triggered

## Обязательные проверки (перед каждым PR)

- [ ] `prefers-reduced-motion` отключает transform/opacity transitions
- [ ] Focus-outline видимый (2px solid --champagne или --mocha, offset 2px)
- [ ] Контраст текста на всех фонах ≥ 4.5:1 (WCAG AA)
- [ ] Mobile-first: компоненты разработаны сначала для 375px, затем расширяются
- [ ] Анимации не мешают скролу на мобайле (touch-action: pan-y)
