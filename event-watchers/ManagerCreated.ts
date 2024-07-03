import { parseAbi } from "viem";
import { ContractWatcher } from "../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "./eventHelpers.js";
import { ManagerCreated } from "../types/vesting/vesting-events.js";
import { Storage } from "../types/storage.js";

export function watchManagerCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("ManagerCreated", {
    abi: parseAbi(["event ManagerCreated(address indexed manager)"]),
    eventName: "ManagerCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "ManagerCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as ManagerCreated;

          await processManagerCreated(event, storage);
        })
      );
    },
  });
}

export async function processManagerCreated(event: ManagerCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
