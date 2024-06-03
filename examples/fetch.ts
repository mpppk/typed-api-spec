import { PathMap } from "./spec";
import { TFetch } from "../src";
import { JSON$stringifyT } from "../src/json";
import { unreachable } from "../src/utils";

const fetchT = fetch as TFetch<typeof origin, PathMap>;
const origin = "http://localhost:3000";
const headers = { "Content-Type": "application/json" };
// stringify is same as JSON.stringify but with type information
const stringify = JSON.stringify as JSON$stringifyT;

const main = async () => {
  {
    const path = `${origin}/users`;
    const method = "get";
    const res = await fetchT(path, { method });
    switch (res.status) {
      case 200: {
        // r is the response schema defined in pathMap["/users"]["get"].res["200"]
        const r = await res.json();
        console.log(`${path}:${method} => ${r.userNames}`);
        break;
      }
      case 400: {
        // e is the response schema defined in pathMap["/users"]["get"].res["400"]
        const e = await res.json();
        console.log(`${path}:${method} => ${e.errorMessage}`);
        break;
      }
      default:
        unreachable(res);
    }
  }

  {
    // query parameter example
    // TODO: Add type information for query parameter
    const path = `${origin}/users?page=1`;
    const method = "get";
    const res = await fetchT(path, { method });
    if (res.ok) {
      // r is the response schema defined in pathMap["/users"]["get"].res["20X"]
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userNames}`);
    } else {
      // e is the response schema defined in pathMap["/users"]["get"].res other than "20X"
      const e = await res.json();
      console.log(`${path}:${method} => ${e.errorMessage}`);
    }
  }

  {
    const path = `${origin}/users`;
    const method = "post";
    const res = await fetchT(path, {
      method,
      headers,
      // body is the request schema defined in pathMap["/users"]["post"].body
      // stringify is same as JSON.stringify but with type information
      body: stringify({ userName: "user1" }),
    });
    if (res.ok) {
      // r is the response schema defined in pathMap["/users"]["post"].res["20X"]
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userId}`);
    } else {
      // e is the response schema defined in pathMap["/users"]["post"].res other than "20X"
      const e = await res.json();
      console.log(`${path}:${method} => ${e.errorMessage}`);
    }
  }

  {
    // path parameter example
    // "/users/:userId" accepts `/users/${string}` pattern
    const path = `${origin}/users/1`;
    const method = "get";
    const res = await fetchT(path, { method });
    if (res.ok) {
      // r is the response schema defined in pathMap["/users/:userId"]["get"].res["20X"]
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userName}`);
    } else {
      // e is the response schema defined in pathMap["/users/:userId"]["get"].res other than "20X"
      const e = await res.json();
      console.log(`${path}:${method} => ${e.errorMessage}`);
    }
  }
};

main();
