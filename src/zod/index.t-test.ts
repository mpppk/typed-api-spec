// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Equal, Expect } from "../core/type-test";
import {
  ToZodResponseValidators,
  ToZodValidators,
  ZodApiEndpoints,
  ZodResponseValidators,
  ZodValidators,
} from "./index";
import { z } from "zod";
import { ApiP } from "../core";

const ZodResponse = z.object({ a: z.string() });
const ZodEndpoints = {
  "/": {
    get: {
      query: z.object({ q: z.string() }),
      responses: {
        200: { body: ZodResponse },
      },
    },
  },
} satisfies ZodApiEndpoints;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToZodValidatorsTestCases = [
  Expect<
    Equal<
      ToZodValidators<typeof ZodEndpoints, "/", "get">,
      ZodValidators<(typeof ZodEndpoints)["/"]["get"], string>
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ZodResponseValidatorsTestCases = [
  Expect<
    Equal<
      ZodResponseValidators<undefined, undefined>,
      { body: undefined; headers: undefined }
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToZodResponseValidatorsTestCases = [
  Expect<
    Equal<
      ToZodResponseValidators<
        ApiP<typeof ZodEndpoints, "/", "get", "responses">,
        200
      >,
      ZodResponseValidators<typeof ZodResponse, undefined>
    >
  >,
];
