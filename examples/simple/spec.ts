import { DefineApiEndpoints, FetchT } from "../../src";

export type PathMap = DefineApiEndpoints<{
  "/users": {
    get: {
      res: {
        200: { userNames: string[] };
        400: { errorMessage: string };
      };
      reqHeaders: { "Content-Type": "application/json" };
      resHeaders: { "Content-Type": "application/json" };
    };
  };
}>;

const main = async () => {
  const fetchT = fetch as FetchT<"", PathMap>;
  const res = await fetchT("/users", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const e = await res.json();
    return console.log(e.errorMessage);
  }
  const r = await res.json();
  console.log(r.userNames);
};

main();
