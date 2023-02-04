import { Application } from "express";
import { App } from "../App";

export function Modules(app: Application) {
  app.get("/api/modules/:name", (req, res) => {
    const name = req.params.name;
    const module = App.instance.modules.find(
      (m) => m.constructor.name.toLowerCase() === name.toLowerCase()
    );
    if (!!module) {
      res.json(module.status);
    } else {
      res.sendStatus(404);
    }
  });
  app.post("/api/modules/:name/request", (req, res) => {
    const name = req.params.name;
    if (App.instance.request(name, req.body.type, req.body.input)) {
      res.json({});
    } else {
      res.sendStatus(404);
    }
  });
}
