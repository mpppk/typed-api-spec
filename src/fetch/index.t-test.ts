import { AsJsonApi, DefineApiEndpoints } from "../common";
import FetchT from "./index";
import JSONT from "../json";

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        resBody: {
          200: { prop: string };
        };
      };
    };
  }>;
  (async () => {
    const f = fetch as FetchT<"", Spec>;
    {
      // TODO: 今はinitを省略する場合undefinedを明示的に渡す必要があるが、なんとかしたい
      // methodを省略した場合はgetとして扱う
      const res = await f("/users", undefined);
      (await res.json()).prop;
    }
  })();
}
{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        resBody: {
          200: { prop: string };
        };
      };
      post: {
        body: {
          userName: string;
        };
        resBody: {
          200: { postProp: string };
          400: { error: string };
        };
      };
    };
  }>;
  type JsonSpec = AsJsonApi<Spec>;
  (async () => {
    const f = fetch as FetchT<"", JsonSpec>;
    const f2 = fetch as FetchT<"", Spec>;
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
      const res = await f("/users", {
        headers: { "Content-Type": "application/json" },
      });
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
      // @ts-expect-error queryが定義されていないSpecに対してクエリパラメータを指定した場合は型エラー
      await f("/users?a=1", {
        headers: { "Content-Type": "application/json" },
      });
    }

    {
      // AsJsonApiを利用していない場合、Content-Typeがapplication/jsonでなくてもエラーにならない
      await f2("/users", {});
    }

    {
      const res = await f("/users", {
        method: "post",
        body: JSONT.stringify({
          userName: "user",
          // TODO: 余剰プロパティチェックを今は受け付けてしまうがなんとかしたい
          unknownProp: "a",
        }),
        headers: { "Content-Type": "application/json" },
      });
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

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        headers: { Cookie: `a=${string}` };
        resBody: {
          200: { prop: string };
        };
      };
    };
  }>;
  (async () => {
    const basePath = "https://example.com/api";
    const f = fetch as FetchT<typeof basePath, Spec>;
    await f(`${basePath}/users`, {
      headers: { Cookie: "a=b" },
    });
  })();

  (async () => {
    // basePathの最後にも/があるのでhttps://example.com/api//usersとなってしまうが、ノーマライズされるので問題ない
    const basePath = "https://example.com/api/";
    const f = fetch as FetchT<typeof basePath, Spec>;
    await f(`${basePath}/users`, {
      headers: { Cookie: "a=b" },
    });
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/packages/list": {
      get: {
        headers: { Cookie: `a=${string}` };
        resBody: {
          200: { prop: string };
        };
        query: {
          state: boolean;
        };
      };
    };
  }>;
  (async () => {
    const basePath = "/api/projects/:projectName/workflow";
    const f = fetch as FetchT<typeof basePath, Spec>;
    {
      const res = await f(
        `/api/projects/projectA/workflow/packages/list?state=true`,
        {
          headers: { Cookie: "a=b" },
        },
      );
      if (res.ok) {
        (await res.json()).prop;
      }

      {
        // @ts-expect-error queryが定義されているSpecに対してクエリパラメータを指定しなかった場合は型エラー
        f(`/api/projects/projectA/workflow/packages/list`, {
          headers: { Cookie: "a=b" },
        });
      }
    }
  })();
}
