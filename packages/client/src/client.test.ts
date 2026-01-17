import { describe, expect, it } from 'vitest'
import { EventMask, MindFry, MindFryError, PhysicsParam } from '../src/index.js'

describe('MindFry', () => {
  it('creates instance with default options', () => {
    const brain = new MindFry()
    expect(brain).toBeInstanceOf(MindFry)
    expect(brain.isConnected).toBe(false)
    expect(brain.pendingRequests).toBe(0)
  })

  it('creates instance with custom options', () => {
    const brain = new MindFry({
      host: '192.168.1.100',
      port: 12345,
      connectTimeout: 10000,
    })
    expect(brain).toBeInstanceOf(MindFry)
  })

  it('exposes namespace APIs', () => {
    const brain = new MindFry()

    // Lineage namespace
    expect(brain.lineage).toBeDefined()
    expect(typeof brain.lineage.create).toBe('function')
    expect(typeof brain.lineage.get).toBe('function')
    expect(typeof brain.lineage.stimulate).toBe('function')
    expect(typeof brain.lineage.forget).toBe('function')
    expect(typeof brain.lineage.touch).toBe('function')

    // Bond namespace
    expect(brain.bond).toBeDefined()
    expect(typeof brain.bond.connect).toBe('function')
    expect(typeof brain.bond.reinforce).toBe('function')
    expect(typeof brain.bond.sever).toBe('function')
    expect(typeof brain.bond.neighbors).toBe('function')

    // Query namespace
    expect(brain.query).toBeDefined()
    expect(typeof brain.query.conscious).toBe('function')
    expect(typeof brain.query.topK).toBe('function')
    expect(typeof brain.query.trauma).toBe('function')
    expect(typeof brain.query.pattern).toBe('function')
    expect(typeof brain.query.neighbors).toBe('function')

    // System namespace
    expect(brain.system).toBeDefined()
    expect(typeof brain.system.ping).toBe('function')
    expect(typeof brain.system.stats).toBe('function')
    expect(typeof brain.system.snapshot).toBe('function')
    expect(typeof brain.system.restore).toBe('function')
    expect(typeof brain.system.freeze).toBe('function')
    expect(typeof brain.system.thaw).toBe('function')
    expect(typeof brain.system.tune).toBe('function')

    // Stream namespace
    expect(brain.stream).toBeDefined()
    expect(typeof brain.stream.subscribe).toBe('function')
    expect(typeof brain.stream.unsubscribe).toBe('function')
    expect(typeof brain.stream.on).toBe('function')
    expect(typeof brain.stream.off).toBe('function')
  })

  it('throws when calling methods without connection', async () => {
    const brain = new MindFry()

    await expect(brain.lineage.create({ key: 'test' })).rejects.toThrow('Not connected')
    await expect(brain.lineage.get('test')).rejects.toThrow('Not connected')
    await expect(brain.system.ping()).rejects.toThrow('Not connected')
  })
})

describe('Exports', () => {
  it('exports MindFryError', () => {
    expect(MindFryError).toBeDefined()
  })

  it('exports EventMask', () => {
    expect(EventMask).toBeDefined()
    expect(EventMask.ALL).toBe(0xffffffff)
    expect(EventMask.LINEAGE_CREATED).toBe(1)
    expect(EventMask.BOND_CREATED).toBe(8)
  })

  it('exports PhysicsParam', () => {
    expect(PhysicsParam).toBeDefined()
    expect(PhysicsParam.DECAY_MULTIPLIER).toBe(0x01)
    expect(PhysicsParam.TRAUMA_THRESHOLD).toBe(0x02)
  })
})
