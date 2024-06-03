import express from "express";
import { typed } from "../src/express";
import { pathMap } from "./spec";

const newApp = () => {
  const app = express();
  app.use(express.json());
  const wApp = typed(pathMap, app);
  wApp.get("/users", (req, res) => {
    const r = res.locals.validate(req).query();
    if (r.success) {
      res.status(200).json({ userNames: [`page${r.data.page}#user1`] });
    } else {
      res.status(400).json({ errorMessage: r.error.toString() });
    }
  });
  wApp.post("/users", (req, res) => {
    const r = res.locals.validate(req).body();
    if (r.success) {
      res.status(200).json({ userId: r.data.userName + "#0" });
    } else {
      res.status(400).json({ errorMessage: r.error.toString() });
    }
  });
  wApp.get("/users/:userId", (req, res) => {
    const params = res.locals.validate(req).params();
    if (!params.success) {
      res.status(400).json({ errorMessage: params.error.toString() });
      return;
    }
    res.status(200).json({ userName: "user#" + params.data.userId });
  });
  return app;
};

const main = async () => {
  const app = newApp();
  const port = 3000;
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

main();
