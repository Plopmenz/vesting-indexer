import { Address } from "viem";
import { EventIdentifier } from "../event-identifier.js";

export interface RewardsEventBase extends EventIdentifier {
  blockNumber: bigint;
  address: Address;
  timestamp: bigint;
}

export type RewardsEvent = ERC20Released;

export interface ERC20Released extends RewardsEventBase {
  type: "ERC20Released";
  beneficiary: Address;
  amount: bigint;
}
