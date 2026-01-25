/**
 * @mindfry/protocol
 *
 * MFBP (MindFry Binary Protocol) implementation for TypeScript.
 * Provides low-level frame encoding/decoding and type definitions.
 */

export { ErrorCode, errorCodeName } from './errors.js'
export { EventMask, PhysicsParam } from './events.js'
export {
  FRAME_HEADER_SIZE,
  MAX_FRAME_SIZE,
  PayloadBuilder,
  PayloadReader,
  decodeString,
  encodeFrame,
  encodeString,
  parseFrame,
  type ParsedFrame,
} from './frames.js'
export { OpCode, isResponseOpCode, opcodeName } from './opcodes.js'
export type { LineageInfo, MindFryEvent, NeighborInfo, ResponseData, StatsInfo } from './types.js'
