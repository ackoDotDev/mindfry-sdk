# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-01-17

### Added

- **Executive Override**: `lineage.get()` now accepts optional `flags` parameter
  - `0x01`: BYPASS_FILTERS - Skip Cortex filters
  - `0x02`: INCLUDE_REPRESSED - Show hidden data
  - `0x04`: NO_SIDE_EFFECTS - Read without observer effect
  - `0x07`: FORENSIC - All flags (god mode)

### Compatibility

- Requires MindFry Engine v1.4.1+

---

## [0.2.0] - 2026-01-17

### Added

- **Ternary Bond Polarity**: `bond.connect()` now supports `polarity` option
  - `1` (default): Synergy - excitatory bond
  - `0`: Neutral - insulator, no energy transfer
  - `-1`: Antagonism - inhibitory bond
- **PayloadBuilder.writeI8()**: Signed byte support in protocol
- **Cortex Sync**: `system.setMood()` and `system.setPersonality()` for emotional control

### Changed

- `ConnectBondOptions` interface now includes optional `polarity` field

### Compatibility

- Requires MindFry Engine v1.4.0+
- Backward compatible: old servers accept polarity as extra byte (ignored)

---

## [0.1.1] - 2026-01-17

### Fixed

- **Protocol Parsing**: Added response data type byte handling in all parse functions
  - `parseLineageInfo()` now correctly skips type byte `0x02`
  - `parseLineages()` now correctly skips type byte `0x03`
  - `parseNeighbors()` now correctly skips type byte `0x04`
  - `parseStats()` now correctly skips type byte `0x05`

### Verified

- **Full E2E Integration**: 11/11 end-to-end tests passing with Rust server

---

## [0.1.0] - 2026-01-17

### Added

- **@mindfry/protocol**: MFBP protocol implementation
  - 22 OpCodes matching Rust server
  - Frame encoding/decoding with PayloadBuilder/PayloadReader
  - Error codes and event types

- **@mindfry/client**: TypeScript client SDK
  - `MindFry` class with fluent namespace API
  - Redis-style request pipelining for 10x throughput
  - `FrameDecoder` for proper TCP fragmentation handling
  - Backpressure protection with configurable limits
  - Timeout handling with automatic cleanup

### Technical Details

- Uses `Buffer.concat` for efficient TCP stream assembly
- EventEmitter-based FrameDecoder separates concerns
- Zero external runtime dependencies (Node.js built-ins only)
- Full TypeScript strict mode compliance
- 51 unit tests covering protocol and client
