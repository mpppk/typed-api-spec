---
sidebar_position: 2
---

# Valibot

[valibot](https://valibot.dev ) is the open source schema library for TypeScript with bundle size, type safety and developer experience in mind.
You can use valibot to define the API specification of typed-api-spec.

```typescript
import { v } from "valibot";

const Spec = {
  "/users/:id": {
    get: {
      params: v.object({ id: v.string() }),
      query: v.object({ page: v.string().optional() }),
      headers: v.object({ "x-api-key": v.string() }),
      responses: {
        200: {
          headers: v.object({ "content-type": v.literal("application/json") }),
          body: v.object({ userNames: v.array(v.string()) }),
        }
      },
    },
  },
} satisfies ZodApiEndpoints
```

### Using server integration

If you use `express`, you can use official integration to validate request parameters based on the API specification.
See the [express](/pkgs/docs/server/express) page for more information.