import { z } from "zod";
import { ToApiEndpoints, ZodApiEndpoints } from "../src";

export const pathMap = {
  "/users": {
    get: {
      query: z.object({
        page: z.string(),
      }),
      res: {
        200: z.object({ userNames: z.string().array() }),
        400: z.object({ errorMessage: z.string() }),
      },
    },
    post: {
      res: {
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
      res: {
        200: z.object({ userName: z.string() }),
        400: z.object({ errorMessage: z.string() }),
      },
    },
  },
} satisfies ZodApiEndpoints;
export type ZodPathMap = typeof pathMap;
export type PathMap = ToApiEndpoints<ZodPathMap>;
