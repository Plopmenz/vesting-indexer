import { parseAbi } from "viem";
import { ContractWatcher } from "../../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "../eventHelpers.js";
import { CliffCreated } from "../../types/vesting/vesting-events.js";
import { Storage } from "../../types/storage.js";

export function watchCliffCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("CliffCreated", {
    abi: parseAbi(["event CliffCreated(uint64 cliff)"]),
    eventName: "CliffCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "CliffCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as CliffCreated;

          await processCliffCreated(event, storage);
        })
      );
    },
  });
}

export async function processCliffCreated(event: CliffCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
