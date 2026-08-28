# ShopExplorer — Dynamic Product Explorer

A responsive TypeScript product catalog powered by the [Fake Store API](https://fakestoreapi.com/). It supports live search, category filtering, sorting, persisted search terms, accessible product-detail modals, loading/error states, and responsive layouts.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## AI prompts used during development

### 1. API and data understanding

> Analyze this Fake Store API product response and explain what data structure we should create in TypeScript. Cover the nested rating object and which fields should be required. Do not write the code yet.

This helped identify a `Product` interface and a separate `Rating` interface with numeric `rate` and `count` fields.

### 2. Debugging

> The app should show a loading message only while `fetch()` is pending, then render products. The current implementation leaves a “Products loaded successfully” status on screen, and the end of the CSS file contains nested `@media` syntax that plain CSS cannot parse. Explain the likely root causes before suggesting focused fixes. Do not rewrite the whole app.

This highlighted that the success message was being made visible in `finally`, and that invalid leftover preprocessor syntax was corrupting the stylesheet.

### 3. Code review

> Review this TypeScript product explorer for DOM manipulation, type safety, API and error handling, responsive behavior, organization, and accessibility. Identify problems and explain why they matter before suggesting changes.

The review led to stronger element checks, escaped API content, semantic status regions, descriptive button labels, keyboard controls, modal focus restoration, and reduced-motion support.

## Reflection

### What did AI help me with?

AI helped analyze the API shape, locate state and stylesheet defects, and review the finished interface against the technical and accessibility requirements. It was most useful as a second pair of eyes for edge cases such as a failed request, an empty result set, keyboard interaction, and small-screen layout.

### What did I have to understand and verify myself?

I had to verify the API contract, decide how search, category, and sorting state should combine, test that `localStorage` restores the exact previous query, and confirm the responsive grid and modal behave correctly at desktop and mobile widths. I also verified that cards are generated from API data rather than hard-coded in the HTML.

### Which AI suggestion did I reject or modify, and why?

I did not add a client-side fallback catalog when the API fails. A fallback can make a demo look more reliable, but it would hide the required failed-request state and could mislead users into thinking stale data is live. The app instead presents a clear error with a retry action.
