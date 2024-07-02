import { parseAbi } from "viem";
import { ContractWatcher } from "../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "./eventHelpers.js";
import { BeneficiaryCreated } from "../types/vesting/vesting-events.js";
import { Storage } from "../types/storage.js";

export function watchBeneficiaryCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("BeneficiaryCreated", {
    abi: parseAbi(["event BeneficiaryCreated(address beneficiary)"]),
    eventName: "BeneficiaryCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "BeneficiaryCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as BeneficiaryCreated;

          await processBeneficiaryCreated(event, storage);
        })
      );
    },
  });
}

export async function processBeneficiaryCreated(event: BeneficiaryCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
