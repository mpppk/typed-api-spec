import { PathMap } from "./spec";
import { TFetch } from "../src";

const fetchT = fetch as TFetch<typeof origin, PathMap>;
const origin = "http://localhost:3000";
const headers = { "Content-Type": "application/json" };

const main = async () => {
  {
    const path = `${origin}/users`;
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
      // TODO: Add type information for body
      body: JSON.stringify({ userName: "user1" }),
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
