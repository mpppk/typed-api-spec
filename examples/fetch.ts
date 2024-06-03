import { PathMap } from "./spec";
import { TFetch } from "../src";

const fetchT = fetch as TFetch<typeof origin, PathMap>;
const origin = "http://localhost:3000";
const headers = { "Content-Type": "application/json" };

const main = async () => {
  {
    const path = `${origin}/users?page=1`;
    const res = await fetchT(path);
    if (res.ok) {
      const r = await res.json();
      console.log(`${path} => ${r.userNames}`);
    } else {
      const e = await res.json();
      console.log(`${path} => ${e.errorMessage}`);
    }
  }

  {
    const path = `${origin}/users`;
    const method = "get";
    const res = await fetchT(path, { method });
    if (res.ok) {
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userNames}`);
    } else {
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
      body: JSON.stringify({ userName: "user1" }),
    });
    if (res.ok) {
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userId}`);
    } else {
      const e = await res.json();
      console.log(`${path}:${method} => ${e.errorMessage}`);
    }
  }

  {
    const path = `${origin}/users/1`;
    const method = "get";
    const res = await fetchT(path, { method });
    if (res.ok) {
      const r = await res.json();
      console.log(`${path}:${method} => ${r.userName}`);
    } else {
      const e = await res.json();
      console.log(`${path}:${method} => ${e.errorMessage}`);
    }
  }
};

main();
