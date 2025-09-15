import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from './user_seeder.js'
import FotoProdukLelangSeeder from './foto_produk_lelang_seeder.js'

export default class extends BaseSeeder {
  public async run() {
    console.log('🎯 Starting database seeding...')
    console.log('')

    // --- Seed Users (Admin & Pembeli) ---
    const userSeeder = new UserSeeder(this.client)
    await userSeeder.run()

    // --- Seed Jenis Produk (run existing seeder) ---
    const { default: JenisProdukSeeder } = await import('./jenis_produk_seeder.js')
    await new JenisProdukSeeder(this.client).run()

    // --- Seed Produk (run existing seeder) ---
    const { default: ProdukSeeder } = await import('./produk_seeder.js')
    await new ProdukSeeder(this.client).run()

    // --- Seed Lelang (run existing seeder) ---
    const { default: LelangSeeder } = await import('./lelang_seeder.js')
    await new LelangSeeder(this.client).run()

    // --- Seed FotoProdukLelang ---
    const fotoProdukSeeder = new FotoProdukLelangSeeder(this.client)
    await fotoProdukSeeder.run()

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
