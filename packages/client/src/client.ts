/**
 * MindFry Client - The main entry point for SDK
 *
 * Usage:
 * ```typescript
 * import { MindFry } from '@mindfry/client';
 *
 * const brain = new MindFry({ host: 'localhost', port: 9527 });
 * await brain.connect();
 *
 * // Create a lineage (memory)
 * await brain.lineage.create({ key: 'fire', energy: 0.9 });
 *
 * // Create a bond (association)
 * await brain.bond.connect({ from: 'fire', to: 'heat', strength: 0.8 });
 *
 * // Query neighbors
 * const neighbors = await brain.query.neighbors('fire');
 * ```
 */

import {
  encodeFrame,
  EventMask,
  OpCode,
  PayloadBuilder,
  PayloadReader,
  PhysicsParam,
  type LineageInfo,
  type MindFryEvent,
  type NeighborInfo,
  type StatsInfo,
} from '@mindfry/protocol'
import { Socket } from 'node:net'
import { RequestPipeline, type PipelineConfig } from './pipeline.js'

// ═══════════════════════════════════════════════════════════════
// CLIENT OPTIONS
// ═══════════════════════════════════════════════════════════════

/** MindFry connection options */
export interface MindFryOptions {
  /** Server hostname (default: 'localhost') */
  host?: string
  /** Server port (default: 9527) */
  port?: number
  /** Connection timeout in ms (default: 5000) */
  connectTimeout?: number
  /** Pipeline configuration */
  pipeline?: Partial<PipelineConfig>
}

const DEFAULT_OPTIONS: Required<Omit<MindFryOptions, 'pipeline'>> = {
  host: 'localhost',
  port: 9527,
  connectTimeout: 5000,
}

// ═══════════════════════════════════════════════════════════════
// LINEAGE API
// ═══════════════════════════════════════════════════════════════

export interface CreateLineageOptions {
  key: string
  energy?: number
  threshold?: number
  decayRate?: number
}

export interface StimulateOptions {
  key: string
  delta: number
}

// ═══════════════════════════════════════════════════════════════
// BOND API
// ═══════════════════════════════════════════════════════════════

export interface ConnectBondOptions {
  from: string
  to: string
  strength?: number
  /** Bond polarity: 1=Synergy, 0=Neutral, -1=Antagonism (default: 1) */
  polarity?: -1 | 0 | 1
}

export interface ReinforceBondOptions {
  from: string
  to: string
  delta: number
}

// ═══════════════════════════════════════════════════════════════
// QUERY API
// ═══════════════════════════════════════════════════════════════

export interface QueryConsciousOptions {
  minEnergy?: number
}

export interface QueryTraumaOptions {
  minRigidity?: number
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLIENT CLASS
// ═══════════════════════════════════════════════════════════════

/**
 * MindFry Client
 *
 * The official TypeScript client for MindFry - The World's First Ephemeral Graph Database.
 * Uses Redis-style pipelining for high-throughput operations.
 */
export class MindFry {
  private socket: Socket | null = null
  private pipeline: RequestPipeline | null = null
  private options: Required<Omit<MindFryOptions, 'pipeline'>>
  private pipelineConfig: Partial<PipelineConfig>
  private eventListeners: Set<(event: MindFryEvent) => void> = new Set()

  constructor(options: MindFryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.pipelineConfig = options.pipeline ?? {}
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Connect to MindFry server
   */
  async connect(): Promise<void> {
    if (this.socket) {
      throw new Error('Already connected')
    }

    return new Promise((resolve, reject) => {
      const socket = new Socket()
      const timeout = setTimeout(() => {
        socket.destroy()
        reject(new Error(`Connection timeout after ${this.options.connectTimeout}ms`))
      }, this.options.connectTimeout)

      socket.connect(this.options.port, this.options.host, () => {
        clearTimeout(timeout)
        this.socket = socket
        this.pipeline = new RequestPipeline(socket, this.pipelineConfig)
        resolve()
      })

      socket.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    if (this.pipeline) {
      this.pipeline.destroy()
      this.pipeline = null
    }

    if (this.socket) {
      return new Promise((resolve) => {
        this.socket!.end(() => {
          this.socket = null
          resolve()
        })
      })
    }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed
  }

  /**
   * Number of pending pipelined requests
   */
  get pendingRequests(): number {
    return this.pipeline?.pendingCount ?? 0
  }

  // ─────────────────────────────────────────────────────────────
  // LINEAGE NAMESPACE
  // ─────────────────────────────────────────────────────────────

  /**
   * Lineage (memory) operations
   */
  readonly lineage = {
    /**
     * Create a new lineage
     */
    create: async (options: CreateLineageOptions): Promise<void> => {
      const payload = new PayloadBuilder()
        .writeString(options.key)
        .writeF32(options.energy ?? 1.0)
        .writeF32(options.threshold ?? 0.5)
        .writeF32(options.decayRate ?? 0.001)
        .build()

      await this.send(OpCode.LINEAGE_CREATE, payload)
    },

    /**
     * Get lineage details
     * @param key - Lineage key
     * @param flags - Optional QueryFlags (0x01=BYPASS, 0x02=INCLUDE_REPRESSED, 0x04=NO_SIDE_EFFECTS, 0x07=FORENSIC)
     */
    get: async (key: string, flags: number = 0): Promise<LineageInfo> => {
      const payload = new PayloadBuilder().writeString(key).writeU8(flags).build()
      const response = await this.send(OpCode.LINEAGE_GET, payload)
      return this.parseLineageInfo(response)
    },

    /**
     * Stimulate a lineage (inject energy)
     */
    stimulate: async (options: StimulateOptions): Promise<void> => {
      const payload = new PayloadBuilder().writeString(options.key).writeF32(options.delta).build()

      await this.send(OpCode.LINEAGE_STIMULATE, payload)
    },

    /**
     * Forget (soft-delete) a lineage
     */
    forget: async (key: string): Promise<void> => {
      const payload = new PayloadBuilder().writeString(key).build()
      await this.send(OpCode.LINEAGE_FORGET, payload)
    },

    /**
     * Touch lineage (update last access time)
     */
    touch: async (key: string): Promise<void> => {
      const payload = new PayloadBuilder().writeString(key).build()
      await this.send(OpCode.LINEAGE_TOUCH, payload)
    },
  }

  // ─────────────────────────────────────────────────────────────
  // BOND NAMESPACE
  // ─────────────────────────────────────────────────────────────

  /**
   * Bond (association) operations
   */
  readonly bond = {
    /**
     * Create a bond between two lineages
     */
    connect: async (options: ConnectBondOptions): Promise<void> => {
      const payload = new PayloadBuilder()
        .writeString(options.from)
        .writeString(options.to)
        .writeF32(options.strength ?? 0.5)
        .writeI8(options.polarity ?? 1)
        .build()

      await this.send(OpCode.BOND_CONNECT, payload)
    },

    /**
     * Reinforce an existing bond
     */
    reinforce: async (options: ReinforceBondOptions): Promise<void> => {
      const payload = new PayloadBuilder()
        .writeString(options.from)
        .writeString(options.to)
        .writeF32(options.delta)
        .build()

      await this.send(OpCode.BOND_REINFORCE, payload)
    },

    /**
     * Sever (disconnect) a bond
     */
    sever: async (from: string, to: string): Promise<void> => {
      const payload = new PayloadBuilder().writeString(from).writeString(to).build()

      await this.send(OpCode.BOND_SEVER, payload)
    },

    /**
     * Get neighbors of a lineage
     */
    neighbors: async (key: string): Promise<NeighborInfo[]> => {
      const payload = new PayloadBuilder().writeString(key).build()
      const response = await this.send(OpCode.BOND_NEIGHBORS, payload)
      return this.parseNeighbors(response)
    },
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY NAMESPACE
  // ─────────────────────────────────────────────────────────────

  /**
   * Query operations
   */
  readonly query = {
    /**
     * Query conscious lineages (energy >= threshold)
     */
    conscious: async (options: QueryConsciousOptions = {}): Promise<LineageInfo[]> => {
      const payload = new PayloadBuilder().writeF32(options.minEnergy ?? 0.0).build()

      const response = await this.send(OpCode.QUERY_CONSCIOUS, payload)
      return this.parseLineages(response)
    },

    /**
     * Get top K lineages by energy
     */
    topK: async (k: number): Promise<LineageInfo[]> => {
      const payload = new PayloadBuilder().writeU32(k).build()
      const response = await this.send(OpCode.QUERY_TOP_K, payload)
      return this.parseLineages(response)
    },

    /**
     * Query traumatized lineages (high rigidity)
     */
    trauma: async (options: QueryTraumaOptions = {}): Promise<LineageInfo[]> => {
      const payload = new PayloadBuilder().writeF32(options.minRigidity ?? 0.8).build()

      const response = await this.send(OpCode.QUERY_TRAUMA, payload)
      return this.parseLineages(response)
    },

    /**
     * Query lineages by pattern (wildcard match)
     */
    pattern: async (pattern: string): Promise<LineageInfo[]> => {
      const payload = new PayloadBuilder().writeString(pattern).build()
      const response = await this.send(OpCode.QUERY_PATTERN, payload)
      return this.parseLineages(response)
    },

    /**
     * Get neighbors (alias for bond.neighbors)
     */
    neighbors: async (key: string): Promise<NeighborInfo[]> => {
      return this.bond.neighbors(key)
    },
  }

  // ─────────────────────────────────────────────────────────────
  // SYSTEM NAMESPACE
  // ─────────────────────────────────────────────────────────────

  /**
   * System operations
   */
  readonly system = {
    /**
     * Ping the server
     */
    ping: async (): Promise<void> => {
      await this.send(OpCode.SYS_PING, new Uint8Array(0))
    },

    /**
     * Get database statistics
     */
    stats: async (): Promise<StatsInfo> => {
      const response = await this.send(OpCode.SYS_STATS, new Uint8Array(0))
      return this.parseStats(response)
    },

    /**
     * Create a snapshot (checkpoint)
     */
    snapshot: async (name?: string): Promise<string> => {
      const payload = new PayloadBuilder().writeString(name ?? '').build()

      const response = await this.send(OpCode.SYS_SNAPSHOT, payload)
      const reader = new PayloadReader(response)
      return reader.readString()
    },

    /**
     * Restore from snapshot
     */
    restore: async (name: string): Promise<void> => {
      const payload = new PayloadBuilder().writeString(name).build()
      await this.send(OpCode.SYS_RESTORE, payload)
    },

    /**
     * Freeze the decay engine
     */
    freeze: async (): Promise<void> => {
      const payload = new PayloadBuilder().writeU8(1).build()
      await this.send(OpCode.SYS_FREEZE, payload)
    },

    /**
     * Thaw (unfreeze) the decay engine
     */
    thaw: async (): Promise<void> => {
      const payload = new PayloadBuilder().writeU8(0).build()
      await this.send(OpCode.SYS_FREEZE, payload)
    },

    /**
     * Tune physics parameters
     */
    tune: async (param: PhysicsParam, value: number): Promise<void> => {
      const payload = new PayloadBuilder().writeU8(param).writeF32(value).build()

      await this.send(OpCode.PHYSICS_TUNE, payload)
    },

    /**
     * Set the Cortex mood (emotional state)
     * Affects consciousness thresholds and decision-making.
     *
     * @param mood Value from -1.0 (stressed/strict) to +1.0 (excited/lenient)
     * @example
     * // Make the system more lenient (lower thresholds)
     * await brain.system.setMood(0.8);
     *
     * // Make the system stricter (higher thresholds)
     * await brain.system.setMood(-0.5);
     */
    setMood: async (mood: number): Promise<void> => {
      // Clamp to valid range
      const clampedMood = Math.max(-1.0, Math.min(1.0, mood))
      const payload = new PayloadBuilder().writeF32(clampedMood).build()
      await this.send(OpCode.SYS_MOOD_SET, payload)
    },
  }

  // ─────────────────────────────────────────────────────────────
  // STREAM NAMESPACE
  // ─────────────────────────────────────────────────────────────

  /**
   * Streaming/subscription operations
   */
  readonly stream = {
    /**
     * Subscribe to events
     */
    subscribe: async (mask: EventMask = EventMask.ALL): Promise<void> => {
      const payload = new PayloadBuilder().writeU32(mask).build()
      await this.send(OpCode.STREAM_SUBSCRIBE, payload)
    },

    /**
     * Unsubscribe from events
     */
    unsubscribe: async (): Promise<void> => {
      await this.send(OpCode.STREAM_UNSUBSCRIBE, new Uint8Array(0))
    },

    /**
     * Add event listener
     */
    on: (listener: (event: MindFryEvent) => void): void => {
      this.eventListeners.add(listener)
    },

    /**
     * Remove event listener
     */
    off: (listener: (event: MindFryEvent) => void): void => {
      this.eventListeners.delete(listener)
    },
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL METHODS
  // ─────────────────────────────────────────────────────────────

  private async send(opcode: OpCode, payload: Uint8Array): Promise<Uint8Array> {
    if (!this.pipeline) {
      throw new Error('Not connected. Call connect() first.')
    }

    const frame = encodeFrame(opcode, payload)
    return this.pipeline.send(frame, opcode)
  }

  private parseLineageInfo(data: Uint8Array): LineageInfo {
    const reader = new PayloadReader(data)
    // Skip response data type byte (0x02 = Lineage)
    reader.readU8()
    return {
      id: reader.readString(),
      energy: reader.readF32(),
      threshold: reader.readF32(),
      decayRate: reader.readF32(),
      rigidity: reader.readF32(),
      isConscious: reader.readBool(),
      lastAccessMs: Number(reader.readU64()),
    }
  }

  private parseLineages(data: Uint8Array): LineageInfo[] {
    const reader = new PayloadReader(data)
    // Skip response data type byte (0x03 = Lineages)
    reader.readU8()
    const count = reader.readU32()
    const result: LineageInfo[] = []

    for (let i = 0; i < count; i++) {
      result.push({
        id: reader.readString(),
        energy: reader.readF32(),
        threshold: reader.readF32(),
        decayRate: reader.readF32(),
        rigidity: reader.readF32(),
        isConscious: reader.readBool(),
        lastAccessMs: Number(reader.readU64()),
      })
    }

    return result
  }

  private parseNeighbors(data: Uint8Array): NeighborInfo[] {
    const reader = new PayloadReader(data)
    // Skip response data type byte (0x04 = Neighbors)
    reader.readU8()
    const count = reader.readU32()
    const result: NeighborInfo[] = []

    for (let i = 0; i < count; i++) {
      result.push({
        id: reader.readString(),
        bondStrength: reader.readF32(),
        isLearned: reader.readBool(),
      })
    }

    return result
  }

  private parseStats(data: Uint8Array): StatsInfo {
    const reader = new PayloadReader(data)
    // Skip response data type byte (0x05 = Stats)
    reader.readU8()
    return {
      lineageCount: reader.readU32(),
      bondCount: reader.readU32(),
      consciousCount: reader.readU32(),
      totalEnergy: reader.readF32(),
      isFrozen: reader.readBool(),
      uptimeSecs: Number(reader.readU64()),
    }
  }
}

// Re-export commonly used types
export { EventMask, PhysicsParam } from '@mindfry/protocol'
export type { LineageInfo, MindFryEvent, NeighborInfo, StatsInfo } from '@mindfry/protocol'
export { MindFryError } from './pipeline.js'
export type { PipelineConfig } from './pipeline.js'
