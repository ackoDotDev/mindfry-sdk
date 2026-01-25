import { describe, expect, it } from 'vitest'
import { OpCode, isResponseOpCode, opcodeName } from './opcodes.js'

describe('OpCode', () => {
  it('has correct values for lineage operations', () => {
    expect(OpCode.LINEAGE_CREATE).toBe(0x10)
    expect(OpCode.LINEAGE_GET).toBe(0x11)
    expect(OpCode.LINEAGE_STIMULATE).toBe(0x12)
    expect(OpCode.LINEAGE_FORGET).toBe(0x13)
    expect(OpCode.LINEAGE_TOUCH).toBe(0x14)
  })

  it('has correct values for bond operations', () => {
    expect(OpCode.BOND_CONNECT).toBe(0x20)
    expect(OpCode.BOND_REINFORCE).toBe(0x21)
    expect(OpCode.BOND_SEVER).toBe(0x22)
    expect(OpCode.BOND_NEIGHBORS).toBe(0x23)
  })

  it('has correct values for query operations', () => {
    expect(OpCode.QUERY_CONSCIOUS).toBe(0x30)
    expect(OpCode.QUERY_TOP_K).toBe(0x31)
    expect(OpCode.QUERY_TRAUMA).toBe(0x32)
    expect(OpCode.QUERY_PATTERN).toBe(0x33)
  })

  it('has correct values for system operations', () => {
    expect(OpCode.SYS_PING).toBe(0x40)
    expect(OpCode.SYS_STATS).toBe(0x41)
    expect(OpCode.SYS_SNAPSHOT).toBe(0x42)
    expect(OpCode.SYS_RESTORE).toBe(0x43)
    expect(OpCode.SYS_FREEZE).toBe(0x44)
    expect(OpCode.PHYSICS_TUNE).toBe(0x45)
  })

  it('has correct values for stream operations', () => {
    expect(OpCode.STREAM_SUBSCRIBE).toBe(0x50)
    expect(OpCode.STREAM_UNSUBSCRIBE).toBe(0x51)
  })

  it('has correct values for response codes', () => {
    expect(OpCode.RESPONSE_OK).toBe(0xf0)
    expect(OpCode.RESPONSE_ERROR).toBe(0xf1)
    expect(OpCode.RESPONSE_EVENT).toBe(0xf2)
  })
})

describe('isResponseOpCode', () => {
  it('returns true for response opcodes', () => {
    expect(isResponseOpCode(OpCode.RESPONSE_OK)).toBe(true)
    expect(isResponseOpCode(OpCode.RESPONSE_ERROR)).toBe(true)
    expect(isResponseOpCode(OpCode.RESPONSE_EVENT)).toBe(true)
    expect(isResponseOpCode(0xff)).toBe(true)
  })

  it('returns false for command opcodes', () => {
    expect(isResponseOpCode(OpCode.SYS_PING)).toBe(false)
    expect(isResponseOpCode(OpCode.LINEAGE_CREATE)).toBe(false)
    expect(isResponseOpCode(OpCode.BOND_CONNECT)).toBe(false)
    expect(isResponseOpCode(0x00)).toBe(false)
  })
})

describe('opcodeName', () => {
  it('returns name for known opcodes', () => {
    expect(opcodeName(OpCode.SYS_PING)).toBe('SYS_PING')
    expect(opcodeName(OpCode.LINEAGE_CREATE)).toBe('LINEAGE_CREATE')
    expect(opcodeName(OpCode.RESPONSE_OK)).toBe('RESPONSE_OK')
  })

  it('returns hex for unknown opcodes', () => {
    expect(opcodeName(0x99 as OpCode)).toBe('UNKNOWN(0x99)')
  })
})
