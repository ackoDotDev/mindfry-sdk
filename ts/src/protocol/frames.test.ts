import { describe, expect, it } from 'vitest'
import {
  decodeString,
  encodeFrame,
  encodeString,
  MAX_FRAME_SIZE,
  parseFrame,
  PayloadBuilder,
  PayloadReader,
} from './frames.js'
import { OpCode } from './opcodes.js'

describe('encodeString / decodeString', () => {
  it('encodes empty string', () => {
    const encoded = encodeString('')
    expect(encoded.length).toBe(2) // Just length prefix
    const [decoded, consumed] = decodeString(encoded, 0)
    expect(decoded).toBe('')
    expect(consumed).toBe(2)
  })

  it('encodes ASCII string', () => {
    const encoded = encodeString('hello')
    expect(encoded.length).toBe(2 + 5)
    const [decoded, consumed] = decodeString(encoded, 0)
    expect(decoded).toBe('hello')
    expect(consumed).toBe(7)
  })

  it('encodes UTF-8 string', () => {
    const encoded = encodeString('こんにちは')
    // UTF-8: each hiragana is 3 bytes = 15 bytes + 2 length prefix
    expect(encoded.length).toBe(2 + 15)
    const [decoded, consumed] = decodeString(encoded, 0)
    expect(decoded).toBe('こんにちは')
    expect(consumed).toBe(17)
  })

  it('decodes at offset', () => {
    const prefix = new Uint8Array([0x00, 0x00, 0x00]) // 3 bytes padding
    const encoded = encodeString('test')
    const combined = new Uint8Array([...prefix, ...encoded])

    const [decoded, consumed] = decodeString(combined, 3)
    expect(decoded).toBe('test')
    expect(consumed).toBe(6)
  })
})

describe('encodeFrame / parseFrame', () => {
  it('encodes frame with empty payload', () => {
    const frame = encodeFrame(OpCode.SYS_PING, new Uint8Array(0))
    expect(frame.length).toBe(5) // 4 bytes length + 1 byte opcode
    expect(frame[4]).toBe(OpCode.SYS_PING)

    const parsed = parseFrame(frame)
    expect(parsed).not.toBeNull()
    expect(parsed!.opcode).toBe(OpCode.SYS_PING)
    expect(parsed!.payload.length).toBe(0)
    expect(parsed!.totalLength).toBe(5)
  })

  it('encodes frame with payload', () => {
    const payload = new Uint8Array([0x01, 0x02, 0x03])
    const frame = encodeFrame(OpCode.LINEAGE_CREATE, payload)
    expect(frame.length).toBe(8) // 4 + 1 + 3

    const parsed = parseFrame(frame)
    expect(parsed!.opcode).toBe(OpCode.LINEAGE_CREATE)
    expect(parsed!.payload).toEqual(payload)
  })

  it('returns null for incomplete header', () => {
    const incomplete = new Uint8Array([0x01, 0x02, 0x03]) // Only 3 bytes
    expect(parseFrame(incomplete)).toBeNull()
  })

  it('returns null for incomplete frame', () => {
    // Header says 10 bytes, but only 5 provided
    const frame = new Uint8Array([0x0a, 0x00, 0x00, 0x00, 0x40])
    expect(parseFrame(frame)).toBeNull()
  })

  it('throws for oversized frame', () => {
    // Construct a header claiming MAX_FRAME_SIZE + 1 bytes
    const oversized = new Uint8Array(8)
    const view = new DataView(oversized.buffer)
    view.setUint32(0, MAX_FRAME_SIZE + 1, true)

    expect(() => parseFrame(oversized)).toThrow(/Frame too large/)
  })
})

describe('PayloadBuilder', () => {
  it('builds empty payload', () => {
    const payload = new PayloadBuilder().build()
    expect(payload.length).toBe(0)
  })

  it('builds u8', () => {
    const payload = new PayloadBuilder().writeU8(255).build()
    expect(payload).toEqual(new Uint8Array([255]))
  })

  it('builds u16 little-endian', () => {
    const payload = new PayloadBuilder().writeU16(0x1234).build()
    expect(payload).toEqual(new Uint8Array([0x34, 0x12]))
  })

  it('builds u32 little-endian', () => {
    const payload = new PayloadBuilder().writeU32(0x12345678).build()
    expect(payload).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]))
  })

  it('builds f32', () => {
    const payload = new PayloadBuilder().writeF32(1.5).build()
    expect(payload.length).toBe(4)
    const view = new DataView(payload.buffer)
    expect(view.getFloat32(0, true)).toBeCloseTo(1.5)
  })

  it('builds string', () => {
    const payload = new PayloadBuilder().writeString('hi').build()
    expect(payload).toEqual(new Uint8Array([0x02, 0x00, 0x68, 0x69]))
  })

  it('chains multiple writes', () => {
    const payload = new PayloadBuilder().writeU8(0x10).writeString('test').writeF32(0.5).build()

    expect(payload.length).toBe(1 + 2 + 4 + 4) // u8 + string(2+4) + f32
  })
})

describe('PayloadReader', () => {
  it('reads u8', () => {
    const reader = new PayloadReader(new Uint8Array([0xff]))
    expect(reader.readU8()).toBe(255)
    expect(reader.remaining).toBe(0)
  })

  it('reads u16 little-endian', () => {
    const reader = new PayloadReader(new Uint8Array([0x34, 0x12]))
    expect(reader.readU16()).toBe(0x1234)
  })

  it('reads u32 little-endian', () => {
    const reader = new PayloadReader(new Uint8Array([0x78, 0x56, 0x34, 0x12]))
    expect(reader.readU32()).toBe(0x12345678)
  })

  it('reads f32', () => {
    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setFloat32(0, 3.14, true)
    const reader = new PayloadReader(new Uint8Array(buffer))
    expect(reader.readF32()).toBeCloseTo(3.14)
  })

  it('reads string', () => {
    const reader = new PayloadReader(new Uint8Array([0x05, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f]))
    expect(reader.readString()).toBe('hello')
    expect(reader.remaining).toBe(0)
  })

  it('reads bool', () => {
    const reader = new PayloadReader(new Uint8Array([0x00, 0x01, 0x02]))
    expect(reader.readBool()).toBe(false)
    expect(reader.readBool()).toBe(true)
    expect(reader.readBool()).toBe(true) // Any non-zero is true
  })

  it('reads complex structure', () => {
    const payload = new PayloadBuilder()
      .writeString('fire')
      .writeF32(0.9)
      .writeF32(0.5)
      .writeF32(0.001)
      .build()

    const reader = new PayloadReader(payload)
    expect(reader.readString()).toBe('fire')
    expect(reader.readF32()).toBeCloseTo(0.9)
    expect(reader.readF32()).toBeCloseTo(0.5)
    expect(reader.readF32()).toBeCloseTo(0.001)
    expect(reader.remaining).toBe(0)
  })
})
