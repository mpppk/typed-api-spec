---
sidebar_position: 2
---

# Getting Started

Let's assume you have a npm project with code like this that __fetch__ from GitHub:

```typescript
const GITHUB_API_ORIGIN = "https://api.github.com";
const url = `/repos/mpppk/typed-api-spec/topics?page=1`;
const response = await fetch(`${GITHUB_API_ORIGIN}${url}`);
if (!response.ok) {
  // response.json() returns any
  const { message } = await response.json()
  return console.error(message);
}
// response.json() returns any
const { names } = await response.json()
console.log(names); // => ["api-spec", "fetch", "typescript"]
```

## Installation

```bash
npm install @mpppk/typed-api-spec
```

## Define API Spec

```typescript
type Spec = DefineApiEndpoints<{
  "/repos/:owner/:repo/topics": {
    get: {
      query: { page?: string };
      responses: {
        200: { body: { names: string[] }; };
        400: { body: { message: string; }; };
      };
    };
  };
}>;
```

## Add types to fetch function

```typescript
import { fetchT } from "@mpppk/typed-api-spec";
const fetch = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
```

## Use fetch function

```typescript {3}
const GITHUB_API_ORIGIN = "https://api.github.com";
const url = `/repos/mpppk/typed-api-spec/topics?page=1`;
const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
const response = await fetchT(`${GITHUB_API_ORIGIN}${url}`);
if (!response.ok) {
  // reponse.json() is typed as { message: string } because resnose is not ok
  const { message } = await response.json()
  return console.error(message);
}
// reponse.json() is typed as { names: string[] } because resnose is ok
const { names } = await response.json()
console.log(names); // => ["api-spec", "fetch", "typescript"]
```

Notice that only few (highlighted) lines have been changed from original, but now the __fetch__ is type-safe.