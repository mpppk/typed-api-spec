import { ImmutableHeaders } from "./headers";

{
  type ContentType =
    | { "Content-Type": "application/json" }
    | { "content-type": "application/json" };
  const headers = new Headers({
    "Content-Type": "application/json",
  }) as unknown as ImmutableHeaders<ContentType & { optionalKey?: string }>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const contentType: "application/json" = headers.get("Content-Type");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const contentType2: "application/json" = headers.get("content-type");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasContentType: true = headers.has("Content-Type");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const optionalKey: boolean = headers.has("optionalKey");
}
