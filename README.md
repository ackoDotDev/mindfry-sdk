# MindFry SDK

> Official TypeScript client for **MindFry** - A Subjective Biological Memory Substrate

[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.4.0-blue)]()

---

> ⚠️ **EXPERIMENTAL:** MindFry simulates biological memory processes. Data may be inhibited or decay based on the system's "mood". **Do not use for banking.**

---

## Installation

```bash
npm install mindfry
```

## Quick Start

```typescript
import { MindFry } from 'mindfry'

const brain = new MindFry({ host: 'localhost', port: 9527 })
await brain.connect()

// Create memories and bonds
await brain.lineage.create({ key: 'trauma', energy: 0.5 })
await brain.lineage.create({ key: 'fear', energy: 0.3 })
await brain.bond.connect({ from: 'trauma', to: 'fear', strength: 1.0, polarity: 1 })

// Stimulate trauma - fear increases automatically
await brain.lineage.stimulate({ key: 'trauma', delta: 1.0 })

const fear = await brain.lineage.get('fear')
console.log(fear.energy) // Increased by synaptic propagation

await brain.disconnect()
```

## Demo

See the [Nabu Awakens](examples/nabu_awakens.ts) demo for a full example of subjective memory behavior.

```bash
npx tsx examples/nabu_awakens.ts
```

## API

Full API documentation coming soon. For now, see [client.ts](packages/client/src/client.ts).

## Requires

- Node.js 20+
- MindFry Engine v1.6.0+

## License

Apache 2.0 © [Erdem Arslan](https://github.com/laphilosophia)
