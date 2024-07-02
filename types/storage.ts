import { Hex } from "viem";
import { PersistentJson } from "../utils/persistent-json.js";
import { RewardsEvent } from "./rewards/rewards-events.js";
import { VestingEvent } from "./vesting/vesting-events.js";

export type Event = RewardsEvent | VestingEvent;
export type EventsStorage = {
  [chainId: number]: {
    [transactionHash: Hex]: {
      [logIndex: number]: Event;
    };
  };
};

export interface Storage {
  events: PersistentJson<EventsStorage>;
}
