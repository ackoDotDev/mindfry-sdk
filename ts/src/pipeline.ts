/**
 * Request Pipeline - Redis-style command pipelining
 *
 * Instead of waiting for each response before sending the next request,
 * we pipeline requests and match responses by sequence ID.
 *
 * This allows 10x+ throughput on a single TCP connection.
 *
 * Flow:
 * 1. Request comes in → assign sequence ID → add to pending map → send frame
 * 2. Response comes in → FrameDecoder assembles → match by FIFO order → resolve promise
 *
 * Pipelining is TRANSPARENT to the caller - each call returns a Promise.
 */

import { Socket } from 'node:net'
import { FrameDecoder } from './framer.js'
import { ErrorCode, OpCode, PayloadReader } from './protocol/index.js'

/** Pending request awaiting response */
interface PendingRequest {
  resolve: (payload: Buffer) => void
  reject: (error: Error) => void
  opcode: OpCode
  timestamp: number
}

/** Pipeline configuration */
export interface PipelineConfig {
  /** Request timeout in milliseconds (default: 30000) */
  timeout: number
  /** Maximum pending requests before backpressure (default: 1000) */
  maxPending: number
  /** Maximum frame size in bytes (default: 16MB) */
  maxFrameSize: number
}

const DEFAULT_CONFIG: PipelineConfig = {
  timeout: 30_000,
  maxPending: 1000,
  maxFrameSize: 16 * 1024 * 1024,
}

/**
 * Request Pipeline Manager
 *
 * Handles multiplexing multiple requests over a single TCP connection.
 * Uses FrameDecoder for proper TCP stream fragmentation handling.
 */
export class RequestPipeline {
  private sequenceId = 0
  private pending: Map<number, PendingRequest> = new Map()
  private decoder: FrameDecoder
  private config: PipelineConfig
  private timeoutChecker: ReturnType<typeof setInterval> | null = null

  constructor(
    private socket: Socket,
    config: Partial<PipelineConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.decoder = new FrameDecoder(this.config.maxFrameSize)
    this.setupSocketHandlers()
    this.startTimeoutChecker()
  }

  /**
   * Send a request and wait for response
   *
   * @param frame - Complete MFBP frame to send
   * @param opcode - OpCode for logging/debugging
   * @returns Promise that resolves with response payload
   */
  send(frame: Uint8Array, opcode: OpCode): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      // Backpressure check
      if (this.pending.size >= this.config.maxPending) {
        reject(new Error(`Pipeline backpressure: ${this.pending.size} pending requests`))
        return
      }

      const seqId = this.nextSequenceId()

      this.pending.set(seqId, {
        resolve: (buf: Buffer) => resolve(new Uint8Array(buf)),
        reject,
        opcode,
        timestamp: Date.now(),
      })

      // Send frame - sequence ID is implicit (FIFO ordering)
      // Note: MFBP is strictly ordered, so we don't need to embed seq ID in frame
      this.socket.write(frame, (err) => {
        if (err) {
          this.pending.delete(seqId)
          reject(err)
        }
      })
    })
  }

  /**
   * Number of requests currently in flight
   */
  get pendingCount(): number {
    return this.pending.size
  }

  /**
   * Bytes waiting in the frame decoder buffer
   */
  get pendingBytes(): number {
    return this.decoder.pendingBytes
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.timeoutChecker) {
      clearInterval(this.timeoutChecker)
      this.timeoutChecker = null
    }

    // Clean up decoder
    this.decoder.removeAllListeners()
    this.decoder.reset()

    // Reject all pending requests
    for (const [seqId, req] of this.pending) {
      req.reject(new Error('Pipeline destroyed'))
      this.pending.delete(seqId)
    }
  }

  private nextSequenceId(): number {
    // Wrap around at 32-bit boundary
    this.sequenceId = (this.sequenceId + 1) & 0xffffffff
    return this.sequenceId
  }

  private setupSocketHandlers(): void {
    // Socket data → FrameDecoder
    this.socket.on('data', (chunk: Buffer) => {
      this.decoder.push(chunk)
    })

    // FrameDecoder → handleFrame (complete frames only)
    this.decoder.on('frame', (payload: Buffer) => {
      this.handleFrame(payload)
    })

    // FrameDecoder errors (e.g., oversized frames)
    this.decoder.on('error', (err: Error) => {
      this.rejectAllPending(err)
    })

    this.socket.on('error', (err) => {
      this.rejectAllPending(err)
    })

    this.socket.on('close', () => {
      this.rejectAllPending(new Error('Connection closed'))
    })
  }

  private handleFrame(payload: Buffer): void {
    // payload = [opcode (1 byte)] + [rest...]
    if (payload.length < 1) {
      console.warn('Received empty frame')
      return
    }

    const opcode = payload[0] as OpCode
    const data = payload.subarray(1)

    // Get the oldest pending request (FIFO order)
    const firstEntry = this.pending.entries().next()
    if (firstEntry.done) {
      // No pending request - could be an async event/notification
      // For now, log and ignore (future: emit as event)
      console.warn('Received response with no pending request')
      return
    }

    const [seqId, request] = firstEntry.value
    this.pending.delete(seqId)

    // Check for error response
    if (opcode === OpCode.RESPONSE_ERROR) {
      const reader = new PayloadReader(new Uint8Array(data))
      const errorCode = reader.readU8() as ErrorCode
      const message = reader.readString()
      request.reject(new MindFryError(errorCode, message))
      return
    }

    // Success - resolve with payload (without opcode byte)
    request.resolve(data)
  }

  private rejectAllPending(error: Error): void {
    for (const [seqId, req] of this.pending) {
      req.reject(error)
      this.pending.delete(seqId)
    }
  }

  private startTimeoutChecker(): void {
    this.timeoutChecker = setInterval(() => {
      const now = Date.now()
      for (const [seqId, req] of this.pending) {
        if (now - req.timestamp > this.config.timeout) {
          req.reject(new Error(`Request timeout after ${this.config.timeout}ms`))
          this.pending.delete(seqId)
        }
      }
    }, 1000) // Check every second
  }
}

/**
 * MindFry-specific error with ErrorCode
 */
export class MindFryError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(`[${ErrorCode[code]}] ${message}`)
    this.name = 'MindFryError'
  }
}
