# WaInfoLelang - Model, Migration, dan Factory

## Overview
WaInfoLelang adalah model yang digunakan untuk mengelola informasi WhatsApp yang berkaitan dengan sistem lelang. Model ini menyimpan data tentang pesan WhatsApp yang dikirim kepada pengguna terkait dengan berbagai event dalam proses lelang.

## Struktur Database

### Tabel: `wa_info_lelangs`

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key |
| `lelang_id` | INTEGER | Foreign key ke tabel `lelangs` |
| `wa_number` | VARCHAR(20) | Nomor WhatsApp tujuan |
| `wa_message` | TEXT | Isi pesan WhatsApp |
| `wa_status` | VARCHAR(20) | Status pengiriman (`pending`, `sent`, `failed`) |
| `sent_at` | TIMESTAMP | Waktu pengiriman pesan |
| `error_message` | TEXT | Pesan error jika gagal kirim |
| `info_type` | VARCHAR(50) | Jenis informasi yang dikirim |
| `additional_data` | JSON | Data tambahan dalam format JSON |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `updated_at` | TIMESTAMP | Waktu update terakhir |

### Foreign Keys
- `lelang_id` → `lelangs.id` (CASCADE on DELETE)

## Model Properties

### Enums
```typescript
type WaStatus = 'pending' | 'sent' | 'failed'
type InfoType = 'auction_start' | 'winner_notification' | 'payment_reminder' | 'auction_end'
```

### Properties
- `id: number` - Primary key
- `lelangId: number` - ID lelang terkait
- `waNumber: string` - Nomor WhatsApp
- `waMessage: string | null` - Isi pesan
- `waStatus: WaStatus` - Status pengiriman
- `sentAt: DateTime | null` - Waktu pengiriman
- `errorMessage: string | null` - Pesan error
- `infoType: InfoType` - Jenis informasi
- `additionalData: object | null` - Data tambahan
- `createdAt: DateTime` - Waktu pembuatan
- `updatedAt: DateTime` - Waktu update

## Relasi

### BelongsTo
- `lelang: BelongsTo<Lelang>` - Relasi ke model Lelang

## Helper Methods

### Status Methods
```typescript
isPending(): boolean     // Cek apakah status pending
isSent(): boolean       // Cek apakah sudah terkirim
isFailed(): boolean     // Cek apakah gagal kirim
```

### Status Update Methods
```typescript
markAsSent(sentAt?: DateTime): void        // Mark sebagai terkirim
markAsFailed(errorMessage: string): void   // Mark sebagai gagal
```

## Cara Penggunaan

### 1. Membuat Record Baru

```typescript
import WaInfoLelang from '#models/wa_info_lelang'

// Membuat notifikasi mulai lelang
const waInfo = await WaInfoLelang.create({
  lelangId: 1,
  waNumber: '6281234567890',
  waMessage: 'Halo! Lelang telah dimulai untuk produk Anda.',
  waStatus: 'pending',
  infoType: 'auction_start',
  additionalData: {
    start_price: 100000,
    duration: '3 hari'
  }
})
```

### 2. Query Data

```typescript
// Get semua pesan pending
const pendingMessages = await WaInfoLelang.query()
  .where('wa_status', 'pending')
  .orderBy('created_at', 'asc')

// Get pesan yang dikirim dalam 24 jam terakhir
const recentSent = await WaInfoLelang.query()
  .where('wa_status', 'sent')
  .where('sent_at', '>=', DateTime.now().minus({ days: 1 }).toSQL())

// Get dengan relasi lelang
const withLelang = await WaInfoLelang.query()
  .preload('lelang')
  .where('info_type', 'winner_notification')
```

### 3. Menggunakan Helper Methods

```typescript
const waInfo = await WaInfoLelang.find(1)

// Cek status
if (waInfo.isPending()) {
  console.log('Message is pending')
}

// Update status
waInfo.markAsSent()
await waInfo.save()

// Atau mark sebagai failed
waInfo.markAsFailed('Connection timeout')
await waInfo.save()
```

## Factory Usage

### Basic Factory
```typescript
import { WaInfoLelangFactory } from '#database/factories/wa_info_lelang_factory'

// Buat 1 record random
const waInfo = await WaInfoLelangFactory.create()

// Buat multiple records
const waInfos = await WaInfoLelangFactory.createMany(10)
```

### Factory States
```typescript
// Buat dengan status tertentu
const pendingWaInfo = await WaInfoLelangFactory.apply('pending').create()
const sentWaInfo = await WaInfoLelangFactory.apply('sent').create()
const failedWaInfo = await WaInfoLelangFactory.apply('failed').create()

// Buat dengan jenis info tertentu
const auctionStart = await WaInfoLelangFactory.apply('auctionStart').create()
const winnerNotif = await WaInfoLelangFactory.apply('winnerNotification').create()
```

### Factory dengan Custom Data
```typescript
const waInfo = await WaInfoLelangFactory.create({
  lelangId: 5,
  waNumber: '6285551234567',
  infoType: 'payment_reminder'
})
```

## Seeder

Jalankan seeder untuk mengisi data dummy:

```bash
node ace db:seed --files="database/seeders/wa_info_lelang_seeder.ts"
```

## Info Types

### `auction_start`
- Dikirim ketika lelang dimulai
- Additional data: `{ start_price: number, duration: string }`

### `winner_notification`
- Dikirim kepada pemenang lelang
- Additional data: `{ winner_bid: number, payment_deadline: string }`

### `payment_reminder`
- Reminder pembayaran untuk pemenang
- Additional data: `{ remaining_time: string, payment_amount: number }`

### `auction_end`
- Notifikasi berakhirnya lelang
- Additional data: `null` atau informasi tambahan

## Migration Commands

```bash
# Jalankan migration
node ace migration:run

# Rollback migration
node ace migration:rollback

# Cek status migration
node ace migration:status
```

## Best Practices

1. **Status Tracking**: Selalu gunakan helper methods untuk update status
2. **Error Handling**: Simpan error message yang jelas untuk debugging
3. **Batch Processing**: Gunakan queue untuk pengiriman WhatsApp dalam jumlah besar
4. **Cleanup**: Hapus record lama secara berkala untuk menjaga performa database
5. **Validation**: Validasi format nomor WhatsApp sebelum menyimpan

## Contoh Penggunaan dalam Controller

```typescript
export default class WaInfoLelangController {
  async sendAuctionStart({ params }: HttpContext) {
    const lelang = await Lelang.findOrFail(params.id)
    
    // Buat record WA info
    const waInfo = await WaInfoLelang.create({
      lelangId: lelang.id,
      waNumber: lelang.petani.phone,
      waMessage: `Lelang untuk ${lelang.produk.name} telah dimulai!`,
      infoType: 'auction_start',
      additionalData: {
        start_price: lelang.starting_price,
        duration: '3 hari'
      }
    })
    
    // Kirim pesan WhatsApp (implementasi WhatsApp API)
    try {
      await sendWhatsAppMessage(waInfo.waNumber, waInfo.waMessage)
      waInfo.markAsSent()
    } catch (error) {
      waInfo.markAsFailed(error.message)
    }
    
    await waInfo.save()
    return waInfo
  }
}
```

## Testing

```typescript
import { test } from '@japa/runner'
import { WaInfoLelangFactory } from '#database/factories/wa_info_lelang_factory'

test.group('WaInfoLelang', () => {
  test('can create wa info lelang', async ({ assert }) => {
    const waInfo = await WaInfoLelangFactory.create()
    assert.exists(waInfo.id)
    assert.equal(waInfo.waStatus, 'pending')
  })

  test('can mark as sent', async ({ assert }) => {
    const waInfo = await WaInfoLelangFactory.create()
    
    waInfo.markAsSent()
    await waInfo.save()
    
    assert.equal(waInfo.waStatus, 'sent')
    assert.exists(waInfo.sentAt)
  })
})
```
