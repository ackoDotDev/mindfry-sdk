# MindFry SDK

> Official client libraries for **MindFry** - The World's First Ephemeral Graph Database

[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm](https://img.shields.io/npm/v/@mindfry/client)](https://www.npmjs.com/package/@mindfry/client)

## What is MindFry?

MindFry is a biologically-inspired database that treats data as living neurons, not static records. Data decays over time, connections strengthen with use, and the database automatically prunes irrelevant information.

This SDK provides high-performance client libraries to interact with a MindFry server.

## Installation

```bash
npm install @mindfry/client
# or
pnpm add @mindfry/client
# or
yarn add @mindfry/client
```

## Quick Start

```typescript
import { MindFry } from '@mindfry/client'

// Connect to MindFry server
const brain = new MindFry({
  host: 'localhost',
  port: 9527,
})

await brain.connect()

// Create memories (lineages)
await brain.lineage.create({ key: 'fire', energy: 0.9 })
await brain.lineage.create({ key: 'heat', energy: 0.7 })
await brain.lineage.create({ key: 'danger', energy: 0.6 })

// Create associations (bonds)
await brain.bond.connect({ from: 'fire', to: 'heat', strength: 0.8 })
await brain.bond.connect({ from: 'fire', to: 'danger', strength: 0.6 })

// Query neighbors
const neighbors = await brain.query.neighbors('fire')
console.log(neighbors)
// [
//   { id: 'heat', bondStrength: 0.8, isLearned: false },
//   { id: 'danger', bondStrength: 0.6, isLearned: false }
// ]

// Get database stats
const stats = await brain.system.stats()
console.log(`Lineages: ${stats.lineageCount}, Bonds: ${stats.bondCount}`)

await brain.disconnect()
```

## API Reference

### Connection

```typescript
const brain = new MindFry({
  host: 'localhost', // Server hostname (default: 'localhost')
  port: 9527, // Server port (default: 9527)
  connectTimeout: 5000, // Connection timeout in ms
  pipeline: {
    timeout: 30000, // Request timeout in ms
    maxPending: 1000, // Max pipelined requests
  },
})

await brain.connect()
await brain.disconnect()

brain.isConnected // Check connection status
brain.pendingRequests // Number of in-flight requests
```

### Lineage (Memory) Operations

```typescript
// Create
await brain.lineage.create({
  key: 'fire',
  energy: 0.9, // Initial energy (0-1)
  threshold: 0.5, // Consciousness threshold
  decayRate: 0.001, // Decay rate per tick
})

// Read
const info = await brain.lineage.get('fire')
// → { id, energy, threshold, decayRate, rigidity, isConscious, lastAccessMs }

// Update (stimulate)
await brain.lineage.stimulate({ key: 'fire', delta: 0.1 })

// Touch (refresh access time)
await brain.lineage.touch('fire')

// Delete (forget)
await brain.lineage.forget('fire')
```

### Bond (Association) Operations

```typescript
// Create bond with polarity
await brain.bond.connect({
  from: 'fire',
  to: 'heat',
  strength: 0.8,
  polarity: 1, // 1=Synergy (default), 0=Neutral, -1=Antagonism
})

// Antagonistic bond (inhibition)
await brain.bond.connect({
  from: 'fear',
  to: 'peace',
  strength: 1.0,
  polarity: -1, // Fear suppresses peace
})

// Reinforce existing bond
await brain.bond.reinforce({
  from: 'fire',
  to: 'heat',
  delta: 0.1,
})

// Get neighbors
const neighbors = await brain.bond.neighbors('fire')
// → [{ id, bondStrength, isLearned }]

// Remove bond
await brain.bond.sever('fire', 'heat')
```

### Query Operations

```typescript
// Get conscious lineages
const conscious = await brain.query.conscious({ minEnergy: 0.5 })

// Get top K by energy
const top = await brain.query.topK(10)

// Get traumatized lineages
const trauma = await brain.query.trauma({ minRigidity: 0.8 })

// Pattern matching
const matches = await brain.query.pattern('fire*')
```

### System Operations

```typescript
// Health check
await brain.system.ping()

// Get stats
const stats = await brain.system.stats()

// Snapshots
const name = await brain.system.snapshot('checkpoint-1')
await brain.system.restore('checkpoint-1')

// Decay control
await brain.system.freeze()
await brain.system.thaw()

// Physics tuning
import { PhysicsParam } from '@mindfry/client'
await brain.system.tune(PhysicsParam.DECAY_MULTIPLIER, 2.0)
```

## Performance: Pipelining

This SDK uses **Redis-style pipelining** for maximum throughput. Instead of waiting for each response before sending the next request, multiple requests are sent in parallel and responses are matched by order.

```typescript
// These all execute in parallel - 10x faster than sequential!
const [a, b, c] = await Promise.all([
  brain.lineage.get('fire'),
  brain.lineage.get('water'),
  brain.lineage.get('earth'),
])
```

### Backpressure Protection

The pipeline automatically limits concurrent requests to prevent overwhelming the server:

```typescript
const brain = new MindFry({
  pipeline: {
    maxPending: 1000, // Max 1000 in-flight requests
    timeout: 30000, // 30s request timeout
  },
})
```

## Packages

| Package             | Description                   |
| ------------------- | ----------------------------- |
| `@mindfry/client`   | Main client SDK               |
| `@mindfry/protocol` | Low-level MFBP protocol types |

## Requirements

- Node.js 20+
- MindFry server running on target host

## License

Apache 2.0 © [Erdem Arslan](https://github.com/laphilosophia)
