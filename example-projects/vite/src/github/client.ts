import type FetchT from "@notainc/typed-api-spec/fetch";
import type { InvalidResponseSpec, Spec } from "./spec.ts";
export const GITHUB_API_ORIGIN = "https://api.github.com";

let fetchGitHub = fetch as FetchT<typeof GITHUB_API_ORIGIN, Spec>;
if (import.meta.env.DEV) {
  const { withValidation } = await import("@notainc/typed-api-spec/fetch");
  const { ZodSpec } = await import("./spec.ts");
  const { newZodValidator } = await import("@notainc/typed-api-spec");
  const v = newZodValidator(ZodSpec);
  fetchGitHub = withValidation(
    fetch,
    ZodSpec,
    v.req,
    v.res,
  ) as typeof fetchGitHub;
}

let fetchInvalidResponseGitHub = fetch as FetchT<
  typeof GITHUB_API_ORIGIN,
  InvalidResponseSpec
>;
if (import.meta.env.DEV) {
  const { withValidation } = await import("@notainc/typed-api-spec/fetch");
  const { InvalidResponseZodSpec } = await import("./spec.ts");
  const { newZodValidator } = await import("@notainc/typed-api-spec");
  const v = newZodValidator(InvalidResponseZodSpec);
  fetchInvalidResponseGitHub = withValidation(
    fetch,
    InvalidResponseZodSpec,
    v.req,
    v.res,
  ) as typeof fetchInvalidResponseGitHub;
}

export { fetchGitHub, fetchInvalidResponseGitHub };
