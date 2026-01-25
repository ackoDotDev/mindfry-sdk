/**
 * @mindfry/sdk
 *
 * Official TypeScript SDK for MindFry - The World's First Ephemeral Graph Database.
 *
 * Features:
 * - Redis-style pipelining for 10x throughput
 * - Fluent namespace API (brain.lineage.create, brain.bond.connect, etc.)
 * - Full TypeScript type safety
 * - Automatic reconnection and timeout handling
 *
 * @example
 * ```typescript
 * import { MindFry } from '@mindfry/sdk';
 *
 * const brain = new MindFry({ host: 'localhost', port: 9527 });
 * await brain.connect();
 *
 * // Create memories
 * await brain.lineage.create({ key: 'fire', energy: 0.9 });
 * await brain.lineage.create({ key: 'heat', energy: 0.7 });
 *
 * // Create association
 * await brain.bond.connect({ from: 'fire', to: 'heat', strength: 0.8 });
 *
 * // Query neighbors
 * const neighbors = await brain.query.neighbors('fire');
 * console.log(neighbors); // [{ id: 'heat', bondStrength: 0.8, isLearned: false }]
 *
 * await brain.disconnect();
 * ```
 */

export { MindFry, type MindFryOptions } from './client.js'
export { MindFryError, type PipelineConfig } from './pipeline.js'

// Re-export protocol types for convenience
export {
  ErrorCode,
  EventMask,
  OpCode,
  PhysicsParam,
  type LineageInfo,
  type MindFryEvent,
  type NeighborInfo,
  type StatsInfo,
} from './protocol/index.js'
