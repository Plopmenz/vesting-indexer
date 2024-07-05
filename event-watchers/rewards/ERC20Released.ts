import { parseAbi } from "viem";
import { ContractWatcher } from "../../utils/contract-watcher.js";
import { addEvent, getTimestamp } from "../eventHelpers.js";
import { ERC20Released } from "../../types/rewards/rewards-events.js";
import { Storage } from "../../types/storage.js";

export function watchERC20Released(contractWatcher: ContractWatcher, storage: Storage) {
  contractWatcher.startWatching("ERC20Released", {
    abi: parseAbi(["event ERC20Released(address indexed beneficiary, uint256 amount)"]),
    eventName: "ERC20Released",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "ERC20Released",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(contractWatcher.chain.id, blockNumber),
            ...args,
          } as ERC20Released;

          await processERC20Released(event, storage);
        })
      );
    },
  });
}

export async function processERC20Released(event: ERC20Released, storage: Storage): Promise<void> {
  await storage.events.update((events) => {
    if (events[event.chainId]?.[event.transactionHash]?.[event.logIndex] !== undefined) {
      return;
    }
    addEvent(events, event);
  });
}
