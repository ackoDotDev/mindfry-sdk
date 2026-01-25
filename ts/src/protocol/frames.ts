/**
 * MFBP Frame Encoding/Decoding
 *
 * Frame Format: [u32 length][u8 opcode][payload...]
 * All multi-byte values are Little-Endian.
 */

import { OpCode } from './opcodes.js'

/** Maximum frame size (16MB safety limit) */
export const MAX_FRAME_SIZE = 16 * 1024 * 1024

/** Frame header size: 4 bytes length + 1 byte opcode */
export const FRAME_HEADER_SIZE = 5

/**
 * Encode a string as [u16 length][utf8 bytes]
 */
export function encodeString(str: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const buffer = new ArrayBuffer(2 + bytes.length)
  const view = new DataView(buffer)
  const result = new Uint8Array(buffer)

  view.setUint16(0, bytes.length, true) // Little-endian
  result.set(bytes, 2)

  return result
}

/**
 * Decode a string from [u16 length][utf8 bytes]
 * Returns [string, bytesConsumed]
 */
export function decodeString(data: Uint8Array, offset: number): [string, number] {
  const view = new DataView(data.buffer, data.byteOffset + offset)
  const length = view.getUint16(0, true)
  const bytes = data.slice(offset + 2, offset + 2 + length)
  const decoder = new TextDecoder()
  return [decoder.decode(bytes), 2 + length]
}

/**
 * Encode a complete MFBP frame
 *
 * @param opcode - The operation code
 * @param payload - The payload bytes (without opcode)
 * @returns Complete frame with length header
 */
export function encodeFrame(opcode: OpCode, payload: Uint8Array): Uint8Array {
  const totalLength = 1 + payload.length // opcode + payload
  const frame = new Uint8Array(4 + totalLength)
  const view = new DataView(frame.buffer)

  // Write length (u32 LE) - includes opcode + payload
  view.setUint32(0, totalLength, true)

  // Write opcode
  frame[4] = opcode

  // Write payload
  frame.set(payload, 5)

  return frame
}

/**
 * Frame parsing result
 */
export interface ParsedFrame {
  opcode: OpCode
  payload: Uint8Array
  totalLength: number
}

/**
 * Try to parse a frame from buffer
 *
 * @returns ParsedFrame if complete frame available, null if more data needed
 * @throws Error if frame is invalid or too large
 */
export function parseFrame(buffer: Uint8Array): ParsedFrame | null {
  if (buffer.length < 4) {
    return null // Need more data for length header
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset)
  const frameLength = view.getUint32(0, true)

  if (frameLength > MAX_FRAME_SIZE) {
    throw new Error(`Frame too large: ${frameLength} > ${MAX_FRAME_SIZE}`)
  }

  const totalLength = 4 + frameLength
  if (buffer.length < totalLength) {
    return null // Need more data for complete frame
  }

  const opcode = buffer[4] as OpCode
  const payload = buffer.slice(5, totalLength)

  return { opcode, payload, totalLength }
}

/**
 * Builder for encoding payloads incrementally
 */
export class PayloadBuilder {
  private chunks: Uint8Array[] = []
  private totalSize = 0

  writeU8(value: number): this {
    const buf = new Uint8Array(1)
    buf[0] = value
    this.chunks.push(buf)
    this.totalSize += 1
    return this
  }

  writeI8(value: number): this {
    const buf = new Uint8Array(1)
    new DataView(buf.buffer).setInt8(0, value)
    this.chunks.push(buf)
    this.totalSize += 1
    return this
  }

  writeU16(value: number): this {
    const buf = new Uint8Array(2)
    new DataView(buf.buffer).setUint16(0, value, true)
    this.chunks.push(buf)
    this.totalSize += 2
    return this
  }

  writeU32(value: number): this {
    const buf = new Uint8Array(4)
    new DataView(buf.buffer).setUint32(0, value, true)
    this.chunks.push(buf)
    this.totalSize += 4
    return this
  }

  writeF32(value: number): this {
    const buf = new Uint8Array(4)
    new DataView(buf.buffer).setFloat32(0, value, true)
    this.chunks.push(buf)
    this.totalSize += 4
    return this
  }

  writeString(value: string): this {
    const encoded = encodeString(value)
    this.chunks.push(encoded)
    this.totalSize += encoded.length
    return this
  }

  build(): Uint8Array {
    const result = new Uint8Array(this.totalSize)
    let offset = 0
    for (const chunk of this.chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }
}

/**
 * Reader for parsing payloads
 */
export class PayloadReader {
  private view: DataView
  private offset = 0

  constructor(private data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  }

  get remaining(): number {
    return this.data.length - this.offset
  }

  readU8(): number {
    const value = this.view.getUint8(this.offset)
    this.offset += 1
    return value
  }

  readU16(): number {
    const value = this.view.getUint16(this.offset, true)
    this.offset += 2
    return value
  }

  readU32(): number {
    const value = this.view.getUint32(this.offset, true)
    this.offset += 4
    return value
  }

  readU64(): bigint {
    const value = this.view.getBigUint64(this.offset, true)
    this.offset += 8
    return value
  }

  readF32(): number {
    const value = this.view.getFloat32(this.offset, true)
    this.offset += 4
    return value
  }

  readString(): string {
    const [str, consumed] = decodeString(this.data, this.offset)
    this.offset += consumed
    return str
  }

  readBool(): boolean {
    return this.readU8() !== 0
  }
}
