# Express

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.


typed-api-spec provides first-class support for Express.
You can apply types to your Express app using the `typed()`.

Here is an example of how to use `express` with `typed-api-spec` and `zod`.

```typescript
const app = express();
app.use(express.json());
const wApp = typed(pathMap, app);
wApp.get("/users", (req, res) => {
// validate method is available in res.locals
// validate(req).query() is equals to pathMap["/users"]["get"].query.safeParse(req.query)
const { data, error } = res.locals.validate(req).query();
if (data !== undefined) {
  // res.status(200).json() accepts only the response schema defined in pathMap["/users"]["get"].res["200"]
  res.status(200).json({ userNames: [`page${data.page}#user1`] });
} else {
  // res.status(400).json() accepts only the response schema defined in pathMap["/users"]["get"].res["400"]
  res.status(400).json({ errorMessage: error.toString() });
}
});
  
newApp().listen(3000, () => { console.log(`Example app listening on port ${port}`); });
```

## API

### typed()

### validate()

### asAsync()

