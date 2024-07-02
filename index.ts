import { config as loadEnv } from "dotenv";
import express from "express";
import storageManager from "node-persist";
import { mainnet, polygon, sepolia } from "viem/chains";

import { registerRoutes } from "./api/simple-router.js";
import { historySync } from "./utils/history-sync.js";
import { MultichainWatcher } from "./utils/multichain-watcher.js";
import { PersistentJson } from "./utils/persistent-json.js";
import { EventsStorage, Storage } from "./types/storage.js";
import { Address } from "viem";
import { watchBeneficiaryCreated } from "./event-watchers/BeneficiaryCreated.js";
import { watchERC721OwnerBeneficiaryCreated } from "./event-watchers/ERC721OwnerBeneficiaryCreated.js";
import { watchLinearVestingCreated } from "./event-watchers/LinearVestingCreated.js";
import { watchManagerCreated } from "./event-watchers/ManagerCreated.js";
import { watchMerkleCreated } from "./event-watchers/MerkleCreated.js";
async function start() {
  const loadEnvResult = loadEnv();
  if (loadEnvResult.error) {
    console.warn(`Error while loading .env: ${loadEnvResult.error}`);
  }

  // Make contract watcher for each chain (using Infura provider)
  const multichainWatcher = new MultichainWatcher([
    {
      chain: mainnet,
      rpc: `mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
    },
    {
      chain: sepolia,
      rpc: `sepolia.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
    },
    {
      chain: polygon,
      rpc: `polygon-mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
    },
  ]);

  // Data (memory + json files (synced) currently, could be migrated to a database solution if needed in the future)
  await storageManager.init({ dir: "storage" });
  const storage: Storage = {
    events: new PersistentJson<EventsStorage>("events", {}),
  };

  multichainWatcher.forEach((contractWatcher) => {
    watchBeneficiaryCreated(contractWatcher, storage);
    watchERC721OwnerBeneficiaryCreated(contractWatcher, storage);
    watchLinearVestingCreated(contractWatcher, storage);
    watchManagerCreated(contractWatcher, storage);
    watchMerkleCreated(contractWatcher, storage);
  });

  let isStopping = false;
  process.on("SIGINT", async () => {
    if (isStopping) {
      // Sigint can be fired multiple times
      return;
    }
    isStopping = true;
    console.log("Stopping...");

    multichainWatcher.forEach((contractWatcher) => {
      contractWatcher.stopAll();
    });
    await Promise.all(
      Object.values(storage).map((storageItem) => {
        return storageItem.update(() => {}); // Save all memory values to disk
      })
    );
    process.exit();
  });

  // Webserver
  const app = express();
  registerRoutes(app, storage);

  var server = app.listen(process.env.PORT ?? 3001, () => {
    const addressInfo = server.address() as any;
    var host = addressInfo.address;
    var port = addressInfo.port;
    console.log(`Webserver started on ${host}:${port}`);
  });

  process.stdin.resume();

  process.stdin.on("data", (input) => {
    try {
      const command = input.toString();
      if (command.startsWith("sync ")) {
        // In case some event logs were missed
        const args = command.split(" ").slice(1);
        const chainId = Number(args[0]);
        const fromBlock = BigInt(args[1]);
        const toBlock = BigInt(args[2]);
        historySync(multichainWatcher, chainId, fromBlock, toBlock, args.slice(3) as Address[]).catch((err) =>
          console.error(`Error while executing history sync: ${err}`)
        );
      }
    } catch (err) {
      console.error(`Error interpreting command: ${err}`);
    }
  });
}

start().catch(console.error);
