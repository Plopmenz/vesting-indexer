import { parseAbi } from "viem";
import { ContractWatcher } from "../../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "../eventHelpers.js";
import { StopAt } from "../../types/vesting/vesting-events.js";
import { Storage } from "../../types/storage.js";

export function watchStopAt(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("StopAt", {
    abi: parseAbi(["event StopAt(uint64 stop)"]),
    eventName: "StopAt",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "StopAt",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as StopAt;

          await processStopAt(event, storage);
        })
      );
    },
  });
}

export async function processStopAt(event: StopAt, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
