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
 * 2. Response comes in → parse frame → match by sequence ID → resolve promise
 *
 * Pipelining is TRANSPARENT to the caller - each call returns a Promise.
 */

import { ErrorCode, OpCode, type ParsedFrame, parseFrame, PayloadReader } from '@mindfry/protocol'
import { Socket } from 'node:net'

/** Pending request awaiting response */
interface PendingRequest {
  resolve: (payload: Uint8Array) => void
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
}

const DEFAULT_CONFIG: PipelineConfig = {
  timeout: 30_000,
  maxPending: 1000,
}

/**
 * Request Pipeline Manager
 *
 * Handles multiplexing multiple requests over a single TCP connection.
 */
export class RequestPipeline {
  private sequenceId = 0
  private pending: Map<number, PendingRequest> = new Map()
  private receiveBuffer: Uint8Array = new Uint8Array(0)
  private config: PipelineConfig
  private timeoutChecker: ReturnType<typeof setInterval> | null = null

  constructor(
    private socket: Socket,
    config: Partial<PipelineConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
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
        resolve,
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
   * Clean up resources
   */
  destroy(): void {
    if (this.timeoutChecker) {
      clearInterval(this.timeoutChecker)
      this.timeoutChecker = null
    }

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
    this.socket.on('data', (chunk: Buffer) => {
      this.onData(chunk)
    })

    this.socket.on('error', (err) => {
      this.rejectAllPending(err)
    })

    this.socket.on('close', () => {
      this.rejectAllPending(new Error('Connection closed'))
    })
  }

  private onData(chunk: Buffer): void {
    // Append to receive buffer
    const newBuffer = new Uint8Array(this.receiveBuffer.length + chunk.length)
    newBuffer.set(this.receiveBuffer, 0)
    newBuffer.set(chunk, this.receiveBuffer.length)
    this.receiveBuffer = newBuffer

    // Process complete frames
    this.processFrames()
  }

  private processFrames(): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const frame = parseFrame(this.receiveBuffer)
      if (!frame) {
        break // Need more data
      }

      this.handleFrame(frame)

      // Remove processed frame from buffer
      this.receiveBuffer = this.receiveBuffer.slice(frame.totalLength)
    }
  }

  private handleFrame(frame: ParsedFrame): void {
    // Get the oldest pending request (FIFO order)
    const firstEntry = this.pending.entries().next()
    if (firstEntry.done) {
      // No pending request - this is unexpected
      console.warn('Received response with no pending request')
      return
    }

    const [seqId, request] = firstEntry.value
    this.pending.delete(seqId)

    // Check for error response
    if (frame.opcode === OpCode.RESPONSE_ERROR) {
      const reader = new PayloadReader(frame.payload)
      const errorCode = reader.readU8() as ErrorCode
      const message = reader.readString()
      request.reject(new MindFryError(errorCode, message))
      return
    }

    // Success - resolve with payload
    request.resolve(frame.payload)
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
