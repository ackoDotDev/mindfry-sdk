/**
 * MFBP (MindFry Binary Protocol) OpCodes
 *
 * Each command has a unique 1-byte OpCode for O(1) parsing.
 * These values MUST match the Rust implementation exactly.
 */
export enum OpCode {
  // ═══════════════════════════════════════════════════════════════
  // LINEAGE OPERATIONS (0x10-0x1F)
  // ═══════════════════════════════════════════════════════════════
  LINEAGE_CREATE = 0x10,
  LINEAGE_GET = 0x11,
  LINEAGE_STIMULATE = 0x12,
  LINEAGE_FORGET = 0x13,
  LINEAGE_TOUCH = 0x14,

  // ═══════════════════════════════════════════════════════════════
  // BOND OPERATIONS (0x20-0x2F)
  // ═══════════════════════════════════════════════════════════════
  BOND_CONNECT = 0x20,
  BOND_REINFORCE = 0x21,
  BOND_SEVER = 0x22,
  BOND_NEIGHBORS = 0x23,

  // ═══════════════════════════════════════════════════════════════
  // QUERY OPERATIONS (0x30-0x3F)
  // ═══════════════════════════════════════════════════════════════
  QUERY_CONSCIOUS = 0x30,
  QUERY_TOP_K = 0x31,
  QUERY_TRAUMA = 0x32,
  QUERY_PATTERN = 0x33,

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM OPERATIONS (0x40-0x4F)
  // ═══════════════════════════════════════════════════════════════
  SYS_PING = 0x40,
  SYS_STATS = 0x41,
  SYS_SNAPSHOT = 0x42,
  SYS_RESTORE = 0x43,
  SYS_FREEZE = 0x44,
  PHYSICS_TUNE = 0x45,
  SYS_MOOD_SET = 0x46,

  // ═══════════════════════════════════════════════════════════════
  // STREAM OPERATIONS (0x50-0x5F)
  // ═══════════════════════════════════════════════════════════════
  STREAM_SUBSCRIBE = 0x50,
  STREAM_UNSUBSCRIBE = 0x51,

  // ═══════════════════════════════════════════════════════════════
  // RESPONSE CODES (0xF0-0xFF)
  // ═══════════════════════════════════════════════════════════════
  RESPONSE_OK = 0xf0,
  RESPONSE_ERROR = 0xf1,
  RESPONSE_EVENT = 0xf2,
}

/**
 * Check if an OpCode is a response OpCode
 */
export function isResponseOpCode(opcode: number): boolean {
  return opcode >= 0xf0
}

/**
 * Get human-readable name for OpCode
 */
export function opcodeName(opcode: OpCode): string {
  const name = OpCode[opcode]
  return name !== undefined ? name : `UNKNOWN(0x${opcode.toString(16)})`
}
