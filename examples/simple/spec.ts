import { DefineApiEndpoints, FetchT } from "../../src";

export type PathMap = DefineApiEndpoints<{
  "/users": {
    get: {
      res: {
        200: { userNames: string[] };
        400: { errorMessage: string };
      };
    };
  };
}>;

const main = async () => {
  const fetchT = fetch as FetchT<"", PathMap>;
  const res = await fetchT("/users");
  if (!res.ok) {
    const e = await res.json();
    return console.log(e.errorMessage);
  }
  const r = await res.json();
  console.log(r.userNames);
};

main();
