import { describe, expect, it, vi } from 'vitest'
import { FrameDecoder } from '../src/framer.js'

describe('FrameDecoder', () => {
  describe('basic functionality', () => {
    it('creates instance with default max frame size', () => {
      const decoder = new FrameDecoder()
      expect(decoder.pendingBytes).toBe(0)
    })

    it('creates instance with custom max frame size', () => {
      const decoder = new FrameDecoder(1024)
      expect(decoder.pendingBytes).toBe(0)
    })
  })

  describe('single complete frame', () => {
    it('emits frame event for complete frame', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Frame: [length=5 (u32 LE)] + [payload: 5 bytes]
      const frame = Buffer.from([
        0x05,
        0x00,
        0x00,
        0x00, // length = 5
        0x40,
        0x01,
        0x02,
        0x03,
        0x04, // payload (first byte is typically opcode)
      ])

      decoder.push(frame)

      expect(handler).toHaveBeenCalledTimes(1)
      const payload = handler.mock.calls[0][0] as Buffer
      expect(payload).toEqual(Buffer.from([0x40, 0x01, 0x02, 0x03, 0x04]))
      expect(decoder.pendingBytes).toBe(0)
    })

    it('handles empty payload frame', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Frame with 1-byte payload (just opcode)
      const frame = Buffer.from([
        0x01,
        0x00,
        0x00,
        0x00, // length = 1
        0x40, // opcode only
      ])

      decoder.push(frame)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toEqual(Buffer.from([0x40]))
    })
  })

  describe('fragmented frames', () => {
    it('buffers incomplete frame', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Send only header (incomplete)
      decoder.push(Buffer.from([0x05, 0x00, 0x00, 0x00]))

      expect(handler).not.toHaveBeenCalled()
      expect(decoder.pendingBytes).toBe(4)
    })

    it('assembles frame from multiple chunks', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Chunk 1: header + partial payload
      decoder.push(Buffer.from([0x05, 0x00, 0x00, 0x00, 0x40, 0x01]))
      expect(handler).not.toHaveBeenCalled()
      expect(decoder.pendingBytes).toBe(6)

      // Chunk 2: rest of payload
      decoder.push(Buffer.from([0x02, 0x03, 0x04]))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(decoder.pendingBytes).toBe(0)
    })

    it('handles header split across chunks', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Chunk 1: partial header (2 bytes)
      decoder.push(Buffer.from([0x02, 0x00]))
      expect(handler).not.toHaveBeenCalled()

      // Chunk 2: rest of header + full payload
      decoder.push(Buffer.from([0x00, 0x00, 0xab, 0xcd]))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toEqual(Buffer.from([0xab, 0xcd]))
    })
  })

  describe('coalesced frames', () => {
    it('emits multiple frames from single chunk', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Two frames in one chunk
      const coalesced = Buffer.concat([
        Buffer.from([0x02, 0x00, 0x00, 0x00, 0x40, 0x01]), // Frame 1
        Buffer.from([0x03, 0x00, 0x00, 0x00, 0x41, 0x02, 0x03]), // Frame 2
      ])

      decoder.push(coalesced)

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler.mock.calls[0][0]).toEqual(Buffer.from([0x40, 0x01]))
      expect(handler.mock.calls[1][0]).toEqual(Buffer.from([0x41, 0x02, 0x03]))
      expect(decoder.pendingBytes).toBe(0)
    })

    it('handles coalesced frames with trailing incomplete frame', () => {
      const decoder = new FrameDecoder()
      const handler = vi.fn()
      decoder.on('frame', handler)

      // Complete frame + incomplete frame header
      const mixed = Buffer.concat([
        Buffer.from([0x02, 0x00, 0x00, 0x00, 0x40, 0x01]), // Complete
        Buffer.from([0x05, 0x00, 0x00, 0x00, 0x41]), // Incomplete (needs 4 more bytes)
      ])

      decoder.push(mixed)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(decoder.pendingBytes).toBe(5) // header + 1 byte payload

      // Complete the second frame
      decoder.push(Buffer.from([0x02, 0x03, 0x04, 0x05]))
      expect(handler).toHaveBeenCalledTimes(2)
      expect(decoder.pendingBytes).toBe(0)
    })
  })

  describe('error handling', () => {
    it('emits error for oversized frame', () => {
      const decoder = new FrameDecoder(100) // Max 100 bytes
      const errorHandler = vi.fn()
      const frameHandler = vi.fn()
      decoder.on('error', errorHandler)
      decoder.on('frame', frameHandler)

      // Claim frame size of 200 bytes
      decoder.push(Buffer.from([0xc8, 0x00, 0x00, 0x00]))

      expect(errorHandler).toHaveBeenCalledTimes(1)
      expect(errorHandler.mock.calls[0][0].message).toMatch(/Frame too large/)
      expect(frameHandler).not.toHaveBeenCalled()
      // Buffer should be cleared after error
      expect(decoder.pendingBytes).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears pending buffer', () => {
      const decoder = new FrameDecoder()

      // Push incomplete frame
      decoder.push(Buffer.from([0x05, 0x00, 0x00, 0x00, 0x01]))
      expect(decoder.pendingBytes).toBe(5)

      decoder.reset()
      expect(decoder.pendingBytes).toBe(0)
    })
  })
})
