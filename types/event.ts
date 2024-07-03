import { RewardsEvent } from "./rewards/rewards-events.js";
import { VestingEvent } from "./vesting/vesting-events.js";

export type Event = RewardsEvent | VestingEvent;
