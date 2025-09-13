import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Lelang from '#models/lelang'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    console.log('🚀 Seeding lelang...')

    const now = DateTime.now()
    const end = now.plus({ minutes: 2 })

    const lelangData = [
      {
        namaLelang: 'Lelang Cabai Hari Ini',
        produkId: 1, // pastikan produk id=1 ada
        hargaAwal: 0,
        hargaAkhir: null,
        tanggalMulai: now.minus({ hours: 1 }),
        tanggalSelesai: end,
        totalStock: 100,
        status: 'dibuka' as const, // enum: dibuka|ditutup|selesai
      },
      {
        namaLelang: 'Lelang Cabai Kencana',
        produkId: 2,
        hargaAwal: 0,
        hargaAkhir: null,
        tanggalMulai: now.minus({ hours: 1 }),
        tanggalSelesai: end,
        totalStock: 200,
        status: 'dibuka' as const,
      },
      {
        namaLelang: 'Lelang Beras Hari Ini',
        produkId: 3,
        hargaAwal: 0,
        hargaAkhir: null,
        tanggalMulai: now.plus({ hours: 4 }),
        tanggalSelesai: now.plus({ hours: 8 }),
        totalStock: 150,
        status: 'selesai' as const,
      },
    ]

    // Gunakan Eloquent model create agar event listener terpanggil
    for (const data of lelangData) {
      await Lelang.create(data)
    }

    console.log('✅ Created 3 lelang with auto-scheduling')
  }
}
