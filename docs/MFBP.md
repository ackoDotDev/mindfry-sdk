# MFBP - MindFry Binary Protocol v1.2

Binary communication protocol for MindFry Cognitive Database.

## Wire Format

```
Frame: [Length: u32 LE] [OpCode: u8] [Payload: N bytes]
String: [Length: u16 LE] [UTF-8 bytes]
```

All multi-byte values are **Little-Endian**.

## OpCodes

| Range       | Category | OpCodes                                                |
| ----------- | -------- | ------------------------------------------------------ |
| `0x10-0x1F` | Lineage  | CREATE, GET, STIMULATE, FORGET, TOUCH                  |
| `0x20-0x2F` | Bond     | CONNECT, REINFORCE, SEVER, NEIGHBORS                   |
| `0x30-0x3F` | Query    | CONSCIOUS, TOP_K, TRAUMA, PATTERN                      |
| `0x40-0x4F` | System   | PING, STATS, SNAPSHOT, RESTORE, FREEZE, TUNE, MOOD_SET |
| `0x50-0x5F` | Stream   | SUBSCRIBE, UNSUBSCRIBE                                 |
| `0xF0-0xFF` | Response | OK, ERROR, EVENT                                       |

### Lineage Operations

| OpCode | Name              | Payload                                                      |
| ------ | ----------------- | ------------------------------------------------------------ |
| `0x10` | LINEAGE_CREATE    | `[key: string][energy: f32][threshold: f32][decayRate: f32]` |
| `0x11` | LINEAGE_GET       | `[key: string][flags: u8]`                                   |
| `0x12` | LINEAGE_STIMULATE | `[key: string][delta: f32][flags: u8]`                       |
| `0x13` | LINEAGE_FORGET    | `[key: string]`                                              |
| `0x14` | LINEAGE_TOUCH     | `[key: string]`                                              |

### Bond Operations

| OpCode | Name           | Payload                                                   |
| ------ | -------------- | --------------------------------------------------------- |
| `0x20` | BOND_CONNECT   | `[from: string][to: string][strength: f32][polarity: i8]` |
| `0x21` | BOND_REINFORCE | `[from: string][to: string][delta: f32]`                  |
| `0x22` | BOND_SEVER     | `[from: string][to: string]`                              |
| `0x23` | BOND_NEIGHBORS | `[key: string]`                                           |

### Response Format

| OpCode | Name           | Payload                            |
| ------ | -------------- | ---------------------------------- |
| `0xF0` | RESPONSE_OK    | `[dataType: u8][data...]`          |
| `0xF1` | RESPONSE_ERROR | `[errorCode: u8][message: string]` |
| `0xF2` | RESPONSE_EVENT | `[eventType: u8][data...]`         |

## Data Types

### LineageInfo

```
[id: string][energy: f32][threshold: f32][decayRate: f32]
[rigidity: f32][isConscious: bool][lastAccessMs: u64]
```

### NeighborInfo

```
[id: string][bondStrength: f32][isLearned: bool]
```

### StatsInfo

```
[lineageCount: u32][bondCount: u32][consciousCount: u32]
[totalEnergy: f32][isFrozen: bool][uptimeSecs: u64]
```

## Query Flags

| Flag              | Value  | Description                 |
| ----------------- | ------ | --------------------------- |
| BYPASS            | `0x01` | Bypass consciousness filter |
| INCLUDE_REPRESSED | `0x02` | Include repressed memories  |
| NO_SIDE_EFFECTS   | `0x04` | Don't update lastAccess     |
| FORENSIC          | `0x07` | All flags combined          |

---

**Reference**: This specification is implemented in TypeScript (`ts/`), with Go, Python, and Rust implementations planned.
