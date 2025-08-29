// database/seeders/JenisProdukSeeder.ts
import {BaseSeeder} from '@adonisjs/lucid/seeders'
import JenisProduk from '#models/jenis_produk'

export default class extends BaseSeeder {
  async run () {
    await JenisProduk.createMany([
      {
        nama_jenis_produk: 'Kopi',
      },
      {
        nama_jenis_produk: 'Beras',
      },
      {
        nama_jenis_produk: 'Coklat',
      },
    ])
  }
}
