import { AsJsonApi, DefineApiEndpoints } from "../common";
import FetchT from "./index";
import JSONT from "../json";
const JSONT = JSON as JSONT;

{
  type Spec = DefineApiEndpoints<{
    "/users": {
      get: {
        responses: { 200: { body: { prop: string } } };
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
        responses: { 200: { body: { prop: string } } };
      };
      post: {
        body: {
          userName: string;
        };
        responses: {
          200: { body: { postProp: string } };
          400: { body: { error: string } };
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
        responses: { 200: { body: { prop: string } } };
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
        responses: { 200: { body: { prop: string } } };
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
    }
    {
      // @ts-expect-error queryが定義されているSpecに対してクエリパラメータを指定しなかった場合は型エラー
      f(`/api/projects/projectA/workflow/packages/list`, {
        headers: { Cookie: "a=b" },
      });
    }
  })();
}

{
  type Spec = DefineApiEndpoints<{
    "/vectorize/indexes/:indexName": {
      post: {
        responses: { 200: { body: { prop2: string } } };
      };
    };
    "/vectorize/indexes/:indexName/get-by-ids": {
      post: {
        body: { ids: string[] };
        responses: { 200: { body: { prop: string } } };
      };
    };
  }>;
  (async () => {
    const CLOUDFLARE_API_HOST = "https://api.cloudflare.com/client/v4";
    const getCloudflareAccountEndpoint = (accountId: string) =>
      `${CLOUDFLARE_API_HOST}/accounts/${accountId}` as const;
    const basePath = getCloudflareAccountEndpoint("accountId");
    const f = fetch as FetchT<typeof basePath, Spec>;
    {
      const res = await f(`${basePath}/vectorize/indexes/indexA/get-by-ids`, {
        method: "POST",
        body: JSONT.stringify({ ids: ["1", "2", "3"] }),
      });
      if (res.ok) {
        (await res.json()).prop;
      }
    }
  })();
}
