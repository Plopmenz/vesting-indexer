import { Express, Response, json } from "express";
import { Storage } from "../types/storage.js";
import { Hex, isHex } from "viem";
import { EventReturn, FilterEventsReturn } from "./return-types.js";
import { replacer, reviver } from "../utils/json.js";
import { ObjectFilter, passesObjectFilter } from "./filter.js";

function malformedRequest(res: Response, error: string): void {
  res.statusCode = 400;
  res.end(error);
}

export function registerRoutes(app: Express, storage: Storage) {
  const basePath = "/indexer/";
  app.use(json());

  // Get single event
  app.get(basePath + "event/:chainId/:transactionHash/:logIndex", async function (req, res) {
    const chainId = parseInt(req.params.chainId);
    if (Number.isNaN(chainId)) {
      return malformedRequest(res, "chainId is not a valid number");
    }

    const transactionHash = req.params.transactionHash;
    if (!isHex(transactionHash)) {
      return malformedRequest(res, "transactionHash is not in a valid hex format");
    }

    const logIndex = parseInt(req.params.logIndex);
    if (Number.isNaN(logIndex)) {
      return malformedRequest(res, "logIndex is not a valid number");
    }

    const events = await storage.events.get();
    const event = events[chainId]?.[transactionHash]?.[logIndex];

    if (!event) {
      res.statusCode = 404;
      return res.end("Event not found");
    }

    res.end(JSON.stringify(event as EventReturn, replacer));
  });

  // Get all events that pass a certain filter
  app.post(basePath + "filterEvents", async function (req, res) {
    try {
      const filter: ObjectFilter = JSON.parse(JSON.stringify(req.body), reviver);

      const events = await storage.events.get();
      const filterTasks = Object.keys(events)
        .map(parseInt)
        .map((chainId) =>
          Object.keys(events[chainId]).map((transactionHash) => {
            return { chainId: chainId, transactionHash: transactionHash as Hex };
          })
        )
        .flat(1)
        .map((eventId) =>
          Object.keys(events[eventId.chainId][eventId.transactionHash])
            .map(parseInt)
            .map((logIndex) => {
              return { ...eventId, logIndex: logIndex };
            })
        )
        .flat(1)
        .filter((eventId) => {
          const event = {
            ...eventId,
            ...events[eventId.chainId][eventId.transactionHash][eventId.logIndex],
          };
          return passesObjectFilter(event, filter);
        });

      res.end(JSON.stringify(filterTasks as FilterEventsReturn, replacer));
    } catch (error: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error?.message ?? "Unknown error" }));
    }
  });
}
