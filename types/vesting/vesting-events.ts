import { Address, Hash } from "viem";
import { EventIdentifier } from "../event-identifier.js";

export interface VestingEventBase extends EventIdentifier {
  blockNumber: bigint;
  address: Address;
  timestamp: bigint;
}

export type VestingEvent = BeneficiaryCreated | CliffCreated | ERC721OwnerBeneficiaryCreated | LinearVestingCreated | ManagerCreated | MerkleCreated | StopAt;

export interface BeneficiaryCreated extends VestingEventBase {
  type: "BeneficiaryCreated";
  beneficiary: Address;
}

export interface CliffCreated extends VestingEventBase {
  type: "CliffCreated";
  cliff: bigint;
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

export interface StopAt extends VestingEventBase {
  type: "StopAt";
  stop: bigint;
}
