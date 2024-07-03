import { parseAbi } from "viem";
import { ContractWatcher } from "../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "./eventHelpers.js";
import { ERC721OwnerBeneficiaryCreated } from "../types/vesting/vesting-events.js";
import { Storage } from "../types/storage.js";

export function watchERC721OwnerBeneficiaryCreated(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("ERC721OwnerBeneficiaryCreated", {
    abi: parseAbi(["event ERC721OwnerBeneficiaryCreated(address indexed ownerToken)"]),
    eventName: "ERC721OwnerBeneficiaryCreated",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "ERC721OwnerBeneficiaryCreated",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as ERC721OwnerBeneficiaryCreated;

          await processERC721OwnerBeneficiaryCreated(event, storage);
        })
      );
    },
  });
}

export async function processERC721OwnerBeneficiaryCreated(event: ERC721OwnerBeneficiaryCreated, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
