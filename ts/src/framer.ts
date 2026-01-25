import { EventEmitter } from 'node:events'

/**
 * FrameDecoder - TCP Stream'den Length-Prefixed Frame Ayrıştırıcı
 *
 * TCP bir "Stream"dir, "Packet" değildir.
 * - Birden fazla frame tek 'data' event'inde birleşik gelebilir
 * - Tek bir büyük frame parçalanmış gelebilir
 *
 * Bu sınıf MFBP frame formatını ayrıştırır:
 * [Length: u32 LE] + [Payload: N bytes]
 *
 * @example
 * ```typescript
 * const decoder = new FrameDecoder();
 *
 * socket.on('data', (chunk) => decoder.push(chunk));
 *
 * decoder.on('frame', (payload) => {
 *   // Tam, bozulmamış bir MFBP paketi
 *   handleResponse(payload);
 * });
 * ```
 */
export class FrameDecoder extends EventEmitter {
  private buffer: Buffer
  private maxFrameSize: number

  /**
   * @param maxFrameSize - Maximum allowed frame size (default: 16MB)
   */
  constructor(maxFrameSize = 16 * 1024 * 1024) {
    super()
    this.buffer = Buffer.alloc(0)
    this.maxFrameSize = maxFrameSize
  }

  /**
   * Socket'ten gelen her 'data' parçasını buraya besle
   */
  push(chunk: Buffer): void {
    // 1. Yeni gelen parçayı mevcudun ucuna ekle
    this.buffer = Buffer.concat([this.buffer, chunk])

    // 2. Buffer'da işlenecek kadar veri var mı döngüsü
    while (this.buffer.length >= 4) {
      // İlk 4 byte'ı (Length) oku - Little Endian!
      const frameLen = this.buffer.readUInt32LE(0)

      // Güvenlik kontrolü: Çok büyük frame'leri reddet
      if (frameLen > this.maxFrameSize) {
        this.emit('error', new Error(`Frame too large: ${frameLen} > ${this.maxFrameSize}`))
        // Buffer'ı temizle ve bağlantıyı kapat
        this.buffer = Buffer.alloc(0)
        return
      }

      // Eğer tüm paket henüz gelmediyse bekle
      // (4 byte header + frameLen kadar payload lazım)
      if (this.buffer.length < 4 + frameLen) {
        break
      }

      // 3. Paketi kesip al (zero-copy subarray)
      const payload = this.buffer.subarray(4, 4 + frameLen)

      // Event fırlat (SDK bunu yakalayıp işleyecek)
      this.emit('frame', payload)

      // 4. İşlenen kısmı Buffer'dan at
      this.buffer = this.buffer.subarray(4 + frameLen)
    }
  }

  /**
   * Bekleyen veri miktarı
   */
  get pendingBytes(): number {
    return this.buffer.length
  }

  /**
   * Buffer'ı temizle
   */
  reset(): void {
    this.buffer = Buffer.alloc(0)
  }
}

// TypeScript event typing
export interface FrameDecoderEvents {
  frame: (payload: Buffer) => void
  error: (error: Error) => void
}

export declare interface FrameDecoder {
  on<K extends keyof FrameDecoderEvents>(event: K, listener: FrameDecoderEvents[K]): this
  emit<K extends keyof FrameDecoderEvents>(
    event: K,
    ...args: Parameters<FrameDecoderEvents[K]>
  ): boolean
}
