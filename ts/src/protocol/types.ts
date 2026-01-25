/**
 * MFBP Type Definitions
 *
 * Response data structures returned by MindFry server.
 */

/**
 * Lineage information returned by GET and query operations
 */
export interface LineageInfo {
  id: string
  energy: number
  threshold: number
  decayRate: number
  rigidity: number
  isConscious: boolean
  lastAccessMs: number
}

/**
 * Neighbor information with bond strength
 */
export interface NeighborInfo {
  id: string
  bondStrength: number
  isLearned: boolean
}

/**
 * Database statistics
 */
export interface StatsInfo {
  lineageCount: number
  bondCount: number
  consciousCount: number
  totalEnergy: number
  isFrozen: boolean
  uptimeSecs: number
}

/**
 * Event notifications for subscribers
 */
export type MindFryEvent =
  | { type: 'lineage_created'; id: string; energy: number }
  | { type: 'lineage_stimulated'; id: string; newEnergy: number; delta: number }
  | { type: 'lineage_forgotten'; id: string }
  | { type: 'bond_created'; source: string; target: string; strength: number }
  | { type: 'bond_severed'; source: string; target: string }
  | { type: 'decay_tick'; processed: number; deadCount: number }
  | { type: 'snapshot_created'; name: string }

/**
 * Response data variants
 */
export type ResponseData =
  | { type: 'ack' }
  | { type: 'pong' }
  | { type: 'lineage'; data: LineageInfo }
  | { type: 'lineages'; data: LineageInfo[] }
  | { type: 'neighbors'; data: NeighborInfo[] }
  | { type: 'stats'; data: StatsInfo }
  | { type: 'snapshot_created'; name: string }
