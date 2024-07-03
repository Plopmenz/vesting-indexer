import { Express, json } from "express";
import { Storage } from "../types/storage.js";
import { FilterEventsReturn } from "./return-types.js";
import { replacer, reviver } from "../utils/json.js";
import { ObjectFilter, passesObjectFilter } from "./filter.js";

export function registerRoutes(app: Express, storage: Storage) {
  const basePath = "/indexer/";
  app.use(json());

  // Get all events that pass a certain filter
  app.post(basePath + "filterEvents", async function (req, res) {
    try {
      const filter: ObjectFilter = JSON.parse(JSON.stringify(req.body), reviver);

      const events = await storage.events.get();
      const filterTasks = Object.values(events)
        .map((chainEvents) => Object.values(chainEvents))
        .flat(1)
        .map((transactionEvents) => Object.values(transactionEvents))
        .flat(1)
        .filter((event) => {
          return passesObjectFilter(event, filter);
        });

      res.end(JSON.stringify(filterTasks as FilterEventsReturn, replacer));
    } catch (error: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error?.message ?? "Unknown error" }));
    }
  });
}
