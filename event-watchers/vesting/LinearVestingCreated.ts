import { parseAbi } from "viem";
import { ContractWatcher } from "../../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "../eventHelpers.js";
import { LinearVestingCreated } from "../../types/vesting/vesting-events.js";
import { Storage } from "../../types/storage.js";

export function watchLinearVestingCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("LinearVestingCreated", {
    abi: parseAbi(["event LinearVestingCreated(uint128 amount, uint64 start, uint64 duration)"]),
    eventName: "LinearVestingCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "LinearVestingCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as LinearVestingCreated;

          await processLinearVestingCreated(event, storage);
        })
      );
    },
  });
}

export async function processLinearVestingCreated(event: LinearVestingCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
