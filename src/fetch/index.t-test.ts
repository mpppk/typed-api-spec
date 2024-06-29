import { DefineApiEndpoints } from "../common";
import FetchT from "./index";
import JSONT from "../json";

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        reqHeaders: { "Content-Type": "application/json" };
        resHeaders: { "Content-Type": "application/json" };
        res: {
          200: { prop: string };
        };
      };
      post: {
        reqHeaders: { "Content-Type": "application/json" };
        resHeaders: { "Content-Type": "application/json" };
        body: {
          userName: string;
        };
        res: {
          200: { postProp: string };
          400: { error: string };
        };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    const JSONT = JSON as JSONT;
    {
      // @ts-expect-error fetch requires input
      f();
    }

    {
      const res = await f("/users", {
        method: "get",
        headers: { "Content-Type": "application/json" },
      });
      // Specで定義したプロパティにアクセスできる
      (await res.json()).prop;
    }

    {
      // methodを省略した場合はgetとして扱う
      const res = await f("/users");
      (await res.json()).prop;
    }

    {
      // methodを省略した場合はgetとして扱う
      const res = await f("/users", {
        headers: { "Content-Type": "application/json" },
      });
      res.headers;
      // Specで定義したプロパティにアクセスできる
      (await res.json()).prop;
    }

    {
      // @ts-expect-error API定義と異なるheadersを指定した場合は型エラー
      await f("/users", { headers: {} });
    }

    {
      // TODO: reqHeadersを定義している場合でもRequestInitが省略できてしまう
      await f("/users");
    }

    {
      const res = await f("/users", {
        method: "post",
        body: JSONT.stringify({
          userName: "user",
          // TODO: 余剰プロパティチェックを今は受け付けてしまうがなんとかしたい
          unknownProp: "a",
        }),
      });
      if (res.ok) {
        (await res.json()).postProp;
      } else {
        (await res.json()).error;
      }
    }

    {
      // TODO: bodyを省略できてしまうがなんとかしたい
      const res = await f("/users", { method: "post" });
      if (res.ok) {
        (await res.json()).postProp;
      } else {
        (await res.json()).error;
      }
    }

    {
      // TODO: 今は定義していないメソッドを受け付けてしまうが、いつかなんとかしたい
      await f("/users", { method: "patch" });
    }
  })();
}
