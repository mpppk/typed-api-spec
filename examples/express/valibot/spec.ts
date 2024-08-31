import * as v from "valibot";
import { ToApiEndpoints, ValibotApiEndpoints } from "../../../src/valibot";

const JsonHeader = v.object({
  "Content-Type": v.literal("application/json"),
});
export const pathMap = {
  "/users": {
    get: {
      query: v.object({
        page: v.string(),
      }),
      resBody: {
        200: v.object({ userNames: v.array(v.string()) }),
        400: v.object({ errorMessage: v.string() }),
      },
    },
    post: {
      headers: JsonHeader,
      resHeaders: JsonHeader,
      resBody: {
        200: v.object({ userId: v.string() }),
        400: v.object({ errorMessage: v.string() }),
      },
      body: v.object({
        userName: v.string(),
      }),
    },
  },
  "/users/:userId": {
    get: {
      params: v.object({ userId: v.string() }),
      resBody: {
        200: v.object({ userName: v.string() }),
        400: v.object({ errorMessage: v.string() }),
      },
    },
  },
} satisfies ValibotApiEndpoints;
export type PathMap = ToApiEndpoints<typeof pathMap>;
