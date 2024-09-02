import { z } from "zod";
import { ToApiEndpoints, ZodApiEndpoints } from "../../src";

const JsonHeader = z.union([
  z.object({ "content-type": z.string() }),
  z.object({ "Content-Type": z.string() }),
]);
export const pathMap = {
  "/users": {
    get: {
      query: z.object({
        page: z.string(),
      }),
      resBody: {
        200: z.object({ userNames: z.string().array() }),
        400: z.object({ errorMessage: z.string() }),
      },
    },
    post: {
      headers: JsonHeader,
      resHeaders: JsonHeader,
      resBody: {
        200: z.object({ userId: z.string() }),
        400: z.object({ errorMessage: z.string() }),
      },
      body: z.object({
        userName: z.string(),
      }),
    },
  },
  "/users/:userId": {
    get: {
      params: z.object({ userId: z.string() }),
      resBody: {
        200: z.object({ userName: z.string() }),
        400: z.object({ errorMessage: z.string() }),
      },
    },
  },
} satisfies ZodApiEndpoints;
export type PathMap = ToApiEndpoints<typeof pathMap>;
