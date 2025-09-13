import {BaseSeeder} from '@adonisjs/lucid/seeders'
import JenisProduk from '#models/jenis_produk'
import Produk from '#models/produk'
import User from '#models/user'
import Pembeli from '#models/pembeli'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run () {
    // --- Seed Users (Admin & Pembeli) ---
    console.log('🚀 Seeding users...')

    // Admin users
    const adminUsers = await User.createMany([
      {
        name: 'Admin Utama',
        email: 'admin@lelang.com',
        password:'admin123',
        role: 'admin',
        emailVerifiedAt: DateTime.now(),
      },
      {
        name: 'Admin Kedua',
        email: 'admin2@lelang.com',
        password:'admin123',
        role: 'admin',
        emailVerifiedAt: DateTime.now(),
      },
    ])

    // Pembeli users with profiles
    const pembeliData = [
      {
        userData: {
          name: 'Budi Santoso',
          email: 'budi@gmail.com',
          password: await hash.make('password123'),
          role: 'pembeli',
          emailVerifiedAt: DateTime.now(),
        },
        pembeliData: {
          alamatPembeli: 'Jl. Merdeka No. 123, Jakarta Pusat',
          teleponPembeli: '081234567890',
          nomorRekening: '1234567890123456',
          fotoKtp: 'ktp_budi.jpg',
          statusVerifikasi: 'approved' as const,
        }
      },
      {
        userData: {
          name: 'Siti Nurhaliza',
          email: 'siti@gmail.com',
          password: await hash.make('password123'),
          role: 'pembeli',
          emailVerifiedAt: DateTime.now(),
        },
        pembeliData: {
          alamatPembeli: 'Jl. Sudirman No. 456, Bandung',
          teleponPembeli: '081234567891',
          nomorRekening: '9876543210987654',
          fotoKtp: 'ktp_siti.jpg',
          statusVerifikasi: 'approved' as const,
        }
      },
      {
        userData: {
          name: 'Maya Putri',
          email: 'maya@gmail.com',
          password: await hash.make('password123'),
          role: 'pembeli',
          emailVerifiedAt: DateTime.now(),
        },
        pembeliData: {
          alamatPembeli: 'Jl. Diponegoro No. 321, Yogyakarta',
          teleponPembeli: '081234567893',
          nomorRekening: '5555666677778888',
          fotoKtp: 'ktp_maya.jpg',
          statusVerifikasi: 'approved' as const,
        }
      },
    ]

    // Create pembeli users and profiles
    for (const data of pembeliData) {
      const user = await User.create(data.userData)
      await Pembeli.create({
        ...data.pembeliData,
        userId: user.id,
      })
    }

    console.log(`✅ Created ${adminUsers.length} admin users`)
    console.log(`✅ Created ${pembeliData.length} pembeli users with profiles`)

    // --- Seed Jenis Produk ---
    console.log('🚀 Seeding product categories...')
    const jenis = await JenisProduk.createMany([
      { nama_jenis_produk: 'Kopi' },
      { nama_jenis_produk: 'Beras' },
      { nama_jenis_produk: 'Coklat' },
    ])

    console.log(`✅ Created ${jenis.length} product categories`)

    // --- Seed Produk ---
    console.log('🚀 Seeding products...')
    const products = await Produk.createMany([
      {
        namaProduk: 'Kopi Arabika Gayo',
        fotoProduk: 'kopi_arabika.jpg',
        jenisProdukId: jenis[0].id, // Kopi
        deskripsiProduk: 'Kopi Arabika Gayo dengan cita rasa khas',
        stock: 100,
      },
      {
        namaProduk: 'Beras Pandan Wangi',
        fotoProduk: 'beras_pandan_wangi.jpg',
        jenisProdukId: jenis[1].id, // Beras
        deskripsiProduk: 'Beras wangi premium dari Jawa Barat',
        stock: 200,
      },
      {
        namaProduk: 'Coklat Fermentasi',
        fotoProduk: 'coklat_fermentasi.jpg',
        jenisProdukId: jenis[2].id, // Coklat
        deskripsiProduk: 'Biji coklat hasil fermentasi alami',
        stock: 50,
      },
    ])

    console.log(`✅ Created ${products.length} products`)

    // --- Run Lelang Seeder ---
    const { default: LelangSeeder } = await import('./lelang_seeder.js')
    await new LelangSeeder(this.client).run()

    console.log('')
    console.log('🎉 Database seeding completed!')
    console.log('')
    console.log('📋 Login credentials:')
    console.log('👑 Admin 1: admin@lelang.com / admin123')
    console.log('👑 Admin 2: admin2@lelang.com / admin123')
    console.log('👤 Pembeli 1: budi@gmail.com / password123 (approved)')
    console.log('👤 Pembeli 2: siti@gmail.com / password123 (approved)')
    console.log('👤 Pembeli 3: maya@gmail.com / password123 (approved)')
  }
}
