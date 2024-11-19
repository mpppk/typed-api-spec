import { newZodValidator, ZodApiEndpoints } from "../../src";
import { ValidateError, withValidation } from "../../src/fetch/validation";
import { z, ZodError } from "zod";

const GITHUB_API_ORIGIN = "https://api.github.com";

// See https://docs.github.com/ja/rest/repos/repos?apiVersion=2022-11-28#get-all-repository-topics
const spec = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: { 200: { body: z.object({ names: z.string().array() }) } },
    },
  },
} satisfies ZodApiEndpoints;
// type Spec = ToApiEndpoints<typeof spec>;
const spec2 = {
  "/repos/:owner/:repo/topics": {
    get: {
      responses: { 200: { body: z.object({ noexist: z.string() }) } },
    },
  },
} satisfies ZodApiEndpoints;

const main = async () => {
  {
    // const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
    const { req: reqValidator, res: resValidator } = newZodValidator(spec);
    const fetchWithV = withValidation(fetch, spec, reqValidator, resValidator);
    const response = await fetchWithV(
      `${GITHUB_API_ORIGIN}/repos/mpppk/typed-api-spec/topics?page=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) {
      const { message } = await response.json();
      return console.error(message);
    }
    const { names } = await response.json();
    console.log(names);
  }

  {
    // const fetchT = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
    const { req: reqValidator, res: resValidator } = newZodValidator(spec2);
    const fetchWithV = withValidation(fetch, spec2, reqValidator, resValidator);
    try {
      await fetchWithV(
        `${GITHUB_API_ORIGIN}/repos/mpppk/typed-api-spec/topics?page=1`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
    } catch (e: unknown) {
      if (e instanceof ValidateError) {
        console.log("error thrown", (e.error as ZodError).format());
      }
    }
  }
};

main();
