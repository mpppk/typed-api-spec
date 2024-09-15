# Specification

The API definition in typed-api-spec consists of the following three layers:

```
Path --> Method --> Spec
```

- Path: The path of the API endpoint.
- Method: The HTTP method of the API endpoint.
- Spec: The specification of the API endpoint, which includes request parameters, response schema, etc.

For example, the following code defines:
- Path: `/users`
- Method: `get`
- Spec: `{ responses: { 200: { body: { userNames: string[] }; }; }; }`

```typescript
type Spec = DefineApiEndpoints<{
  // Path
  "/users": {
    // Method
    get: {
      // Spec
      responses: { 200: { body: { userNames: string[] }; }; };
    };
  };
}>;
```

## Properties

### Path

Path is the path of the API endpoint.
It can contain path parameters like `:id`.

```typescript

type Spec = DefineApiEndpoints<{
  // Path has path parameter `:id`
  "/users/:id": {
    get: {
      params: { id: string };
      responses: { 200: { body: { user: { id: string; name: string }; }; }; };
    };
  };
}>;
```

### Method

Method is the HTTP method of the API endpoint.
It can be one of the following:
- `get`
- `post`
- `put`
- `delete`
- `patch`
- `head`
- `options`

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: { responses: { 200: { body: { userNames: string[] }; }; }; };
    post: { responses: { 200: { body: { userName: string }; }; }; };
  };
}>;
```

### Spec

Spec have the following properties:
- `params`: The path parameters of the request.
- `query`: The query parameters of the request.
- `headers`: The headers of the request.
- `body`: The body of the request.
- `responses`: The response schema of the request.
  - `body`: The body of the response.
  - `headers`: The headers of the response.
  
```typescript
type Spec = DefineApiEndpoints<{
  "/users/:id": {
    get: {
      params: { id: string };
      query: { page?: string };
      headers: { "x-api-key": string };
      responses: { 200: {
        headers: {"content-type": "application/json"};
        body: { userNames: string[] }; };
      };
    };
  };
}>;
```

## Validation library integration

typed-api-spec can be integrated with various validation libraries.
For example, you can use zod to define the schema of the request and response.

```typescript
import { z } from "zod";
import { ZodApiEndpoints } from "./index";

const Spec = {
  "/users/:id": {
    get: {
      params: { id: z.string() },
      query: { page: z.string().optional() },
      headers: { "x-api-key": z.string() },
      responses: {
        200: {
          headers: { "content-type": z.literal("application/json") },
          body: { userNames: z.array(z.string()) },
        }
      },
    },
  },
} satisfies ZodApiEndpoints
```

## API

### DefineApiEndpoints

DefineApiEndpoints is a utility type that defines the API specification.
If you write wrong API specification, DefineApiEndpoints will throw a type error.

```typescript
type Spec = DefineApiEndpoints<{
  "/users": {
    get: { responses: { 200: { body: { userNames: string[] }; }; }; };
  };
}>;
```

TODO: Add StackBlitz demo