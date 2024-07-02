import { Address, Hash } from "viem";
import { EventIdentifier } from "../event-identifier.js";

export interface VestingEventBase extends EventIdentifier {
  blockNumber: bigint;
  address: Address;
  timestamp: bigint;
}

export type VestingEvent = BeneficiaryCreated | ERC721OwnerBeneficiaryCreated | LinearVestingCreated | ManagerCreated | MerkleCreated | Stop;

export interface BeneficiaryCreated extends VestingEventBase {
  type: "BeneficiaryCreated";
  beneficiary: Address;
}

export interface ERC721OwnerBeneficiaryCreated extends VestingEventBase {
  type: "ERC721OwnerBeneficiaryCreated";
  ownerToken: Address;
}

export interface LinearVestingCreated extends VestingEventBase {
  type: "LinearVestingCreated";
  amount: bigint;
  start: bigint;
  duration: bigint;
}

export interface ManagerCreated extends VestingEventBase {
  type: "ManagerCreated";
  manager: Address;
}

export interface MerkleCreated extends VestingEventBase {
  type: "MerkleCreated";
  merkletreeRoot: Hash;
}

export interface Stop extends VestingEventBase {
  type: "Stop";
  newDuration: bigint;
}
