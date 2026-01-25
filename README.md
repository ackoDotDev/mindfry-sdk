# MindFry SDK

> **Official client libraries for MindFry** — Memory with a Conscience

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

Connect to MindFry and manage memories that **decay**, **bond**, and **feel**.

---

> ⚠️ **EXPERIMENTAL:** MindFry simulates biological memory processes. Data may be inhibited based on the system's "mood". **Do not use for banking.**

---

## SDKs

| Language       | Status     | Location      | Package        |
| :------------- | :--------- | :------------ | :------------- |
| **TypeScript** | ✅ Stable  | [`ts/`](./ts) | `@mindfry/sdk` |
| **Go**         | 🚧 Planned | `go/`         | —              |
| **Python**     | 🚧 Planned | `python/`     | —              |
| **Rust**       | 🚧 Planned | `rust/`       | —              |

## TypeScript

```bash
npm install @mindfry/sdk
```

```typescript
import { MindFry } from '@mindfry/sdk'

const brain = new MindFry({ host: 'localhost', port: 9527 })
await brain.connect()

await brain.lineage.create({ key: 'fire', energy: 0.9 })
await brain.lineage.stimulate({ key: 'fire', delta: 0.5 })

await brain.disconnect()
```

📚 **Docs:** [mindfry-docs.vercel.app](https://mindfry-docs.vercel.app)

## Protocol

All SDKs implement [MFBP (MindFry Binary Protocol)](./docs/MFBP.md):

- 🧠 **Lineage** — Create, stimulate, query ephemeral memories
- 🔗 **Bond** — Connect memories with weighted relationships
- 🔍 **Query** — Pattern matching, top-K, trauma detection
- ⚡ **Pipelining** — High-throughput TCP batching
- 🎭 **Mood-aware** — Behavior adapts to Cortex state

## Requirements

- MindFry Engine v1.6.0+
- Language-specific requirements in each SDK folder

## Related

- [MindFry Core](https://github.com/cluster-127/mindfry) — Rust engine
- [Documentation](https://mindfry-docs.vercel.app) — Full docs
- [crates.io](https://crates.io/crates/mindfry) — Rust package

## Contributing

Want to add a new language SDK? See the TypeScript implementation in `ts/` as reference. All SDKs should implement the [MFBP protocol](./docs/MFBP.md).

## License

Apache-2.0 © [Erdem Arslan](https://github.com/cluster-127)
