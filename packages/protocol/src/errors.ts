/**
 * MFBP Error Codes
 *
 * Error codes returned by the MindFry server.
 */
export enum ErrorCode {
  /** Unknown error */
  UNKNOWN = 0x00,
  /** Invalid OpCode */
  INVALID_OPCODE = 0x01,
  /** Malformed payload */
  MALFORMED_PAYLOAD = 0x02,
  /** Server warming up (resurrection in progress) */
  WARMING_UP = 0x03,
  /** Lineage not found */
  LINEAGE_NOT_FOUND = 0x10,
  /** Lineage already exists */
  LINEAGE_EXISTS = 0x11,
  /** Bond not found */
  BOND_NOT_FOUND = 0x20,
  /** Bond already exists */
  BOND_EXISTS = 0x21,
  /** Snapshot not found */
  SNAPSHOT_NOT_FOUND = 0x30,
  /** Internal server error */
  INTERNAL = 0xff,
}

/**
 * Get human-readable name for ErrorCode
 */
export function errorCodeName(code: ErrorCode): string {
  const name = ErrorCode[code]
  return name !== undefined ? name : `UNKNOWN(0x${code.toString(16)})`
}
