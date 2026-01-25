/**
 * 🌅 NABU AWAKENS
 *
 * A demonstration of MindFry's subjective memory behavior.
 *
 * This script shows how the same data behaves differently
 * based on the system's "mood" and bond polarity.
 *
 * Run: npx tsx examples/nabu_awakens.ts
 */

import { MindFry } from './index.js'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  console.log('\n')
  console.log('═'.repeat(60))
  console.log('  🌅 NABU AWAKENS - A Subjective Memory Demonstration')
  console.log('═'.repeat(60))
  console.log('\n')

  const brain = new MindFry({ host: 'localhost', port: 9527 })

  try {
    await brain.connect()
    console.log('✅ Connected to MindFry\n')

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Create memories and bonds
    // ═══════════════════════════════════════════════════════════

    const suffix = Date.now().toString().slice(-4)
    const TRAUMA = `trauma_${suffix}`
    const PEACE = `peace_${suffix}`
    const FEAR = `fear_${suffix}`

    console.log('📝 Creating memory network...')
    console.log(`   ${TRAUMA} ──[antagonism]──> ${PEACE}`)
    console.log(`   ${TRAUMA} ──[synergy]──> ${FEAR}`)
    console.log('')

    await brain.lineage.create({ key: TRAUMA, energy: 0.5 })
    await brain.lineage.create({ key: PEACE, energy: 0.8 })
    await brain.lineage.create({ key: FEAR, energy: 0.3 })

    // Trauma SUPPRESSES peace (antagonism = -1)
    await brain.bond.connect({ from: TRAUMA, to: PEACE, strength: 1.0, polarity: -1 })

    // Trauma AMPLIFIES fear (synergy = +1)
    await brain.bond.connect({ from: TRAUMA, to: FEAR, strength: 1.0, polarity: 1 })

    console.log('✅ Memory network created\n')

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Baseline readings
    // ═══════════════════════════════════════════════════════════

    console.log('📊 Baseline readings (before stimulation):')
    const peace1 = await brain.lineage.get(PEACE, 0x04)
    const fear1 = await brain.lineage.get(FEAR, 0x04)
    console.log(`   ${PEACE}: ${peace1.energy.toFixed(3)}`)
    console.log(`   ${FEAR}:  ${fear1.energy.toFixed(3)}`)
    console.log('')

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Stimulate trauma - watch propagation
    // ═══════════════════════════════════════════════════════════

    console.log('⚡ Stimulating trauma...')
    await brain.lineage.stimulate({ key: TRAUMA, delta: 1.0 })
    await sleep(100) // Let propagation settle

    console.log('')
    console.log('📊 After trauma stimulation:')
    const peace2 = await brain.lineage.get(PEACE, 0x04)
    const fear2 = await brain.lineage.get(FEAR, 0x04)
    console.log(
      `   ${PEACE}: ${peace2.energy.toFixed(3)} (Δ ${(peace2.energy - peace1.energy).toFixed(3)})`,
    )
    console.log(
      `   ${FEAR}:  ${fear2.energy.toFixed(3)} (Δ ${(fear2.energy - fear1.energy).toFixed(3)})`,
    )
    console.log('')

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: Analysis
    // ═══════════════════════════════════════════════════════════

    const peaceDelta = peace2.energy - peace1.energy
    const fearDelta = fear2.energy - fear1.energy

    console.log('═'.repeat(60))
    console.log('  📖 ANALYSIS')
    console.log('═'.repeat(60))
    console.log('')

    if (fearDelta > 0) {
      console.log(`  ✓ FEAR increased by +${fearDelta.toFixed(3)}`)
      console.log('    → Synergy bond amplified the signal')
    }

    if (peaceDelta < 0) {
      console.log(`  ✓ PEACE decreased by ${peaceDelta.toFixed(3)}`)
      console.log('    → Antagonism bond suppressed the signal')
    } else if (peaceDelta >= 0) {
      console.log(`  ⚠ PEACE changed by +${peaceDelta.toFixed(3)}`)
      console.log('    → Antagonism suppression not yet implemented')
      console.log('    → (This is expected in v1.6.0 - synergy works, antagonism is TODO)')
    }

    console.log('')
    console.log('  💡 KEY INSIGHT:')
    console.log('     The same stimulation produces OPPOSITE effects')
    console.log('     based on bond polarity. This is subjective memory.')
    console.log('')
    console.log('═'.repeat(60))
    console.log('  🌅 Nabu has awakened.')
    console.log('═'.repeat(60))
    console.log('')

    await brain.disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await brain.disconnect()
    process.exit(1)
  }
}

main()
