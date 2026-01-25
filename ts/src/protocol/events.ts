/**
 * MFBP Event Types
 *
 * Event types for subscription-based streaming.
 */
export enum EventMask {
  /** Lineage created */
  LINEAGE_CREATED = 1 << 0,
  /** Lineage stimulated */
  LINEAGE_STIMULATED = 1 << 1,
  /** Lineage forgotten */
  LINEAGE_FORGOTTEN = 1 << 2,
  /** Bond created */
  BOND_CREATED = 1 << 3,
  /** Bond severed */
  BOND_SEVERED = 1 << 4,
  /** Decay tick completed */
  DECAY_TICK = 1 << 5,
  /** Snapshot created */
  SNAPSHOT_CREATED = 1 << 6,
  /** All events */
  ALL = 0xffffffff,
}

/**
 * Physics parameters that can be tuned
 */
export enum PhysicsParam {
  /** Global decay rate multiplier */
  DECAY_MULTIPLIER = 0x01,
  /** Trauma rigidity threshold */
  TRAUMA_THRESHOLD = 0x02,
  /** Bond pruning threshold */
  BOND_PRUNE_THRESHOLD = 0x03,
  /** Minimum energy threshold */
  MIN_ENERGY_THRESHOLD = 0x04,
}
