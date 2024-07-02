import { parseAbi } from "viem";
import { ContractWatcher } from "../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "./eventHelpers.js";
import { MerkleCreated } from "../types/vesting/vesting-events.js";
import { Storage } from "../types/storage.js";

export function watchMerkleCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("MerkleCreated", {
    abi: parseAbi(["event MerkleCreated(bytes32 merkletreeRoot)"]),
    eventName: "MerkleCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "MerkleCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as MerkleCreated;

          await processMerkleCreated(event, storage);
        })
      );
    },
  });
}

export async function processMerkleCreated(event: MerkleCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
