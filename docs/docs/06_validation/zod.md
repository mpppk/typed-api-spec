---
sidebar_position: 1
---

# zod

[zod](https://zod.dev) is a TypeScript-first schema declaration and validation library.
You can use zod to define the API specification of typed-api-spec.

```typescript
import { z } from "zod";

const Spec = {
  "/users/:id": {
    get: {
      params: z.object({ id: z.string() }),
      query: z.object({ page: z.string().optional() }),
      headers: z.object({ "x-api-key": z.string() }),
      responses: {
        200: {
          headers: z.object({ "content-type": z.literal("application/json") }),
          body: z.object({ userNames: z.array(z.string()) }),
        }
      },
    },
  },
} satisfies ZodApiEndpoints
```

## Using server integration

If you use `express` or `fastify`, you can use official integration to validate request parameters based on the API specification.
See the [express](/typed-api-spec/docs/server/express) or [fastify](/typed-api-spec/docs/server/fastify) page for more information.
