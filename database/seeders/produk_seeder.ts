// database/seeders/ProdukSeeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Produk from '#models/produk'

export default class extends BaseSeeder {
  async run () {
    await Produk.createMany([
      {
        namaProduk: 'Kopi Arabica Gayo',
        fotoProduk: 'kopi-arabica.jpg',
        jenisProdukId: 1,
        deskripsiProduk: 'Kopi premium dari dataran tinggi Gayo',
        stock: 100,
      },
      {
        namaProduk: 'Beras Merah Organik',
        fotoProduk: 'beras-merah.jpg',
        jenisProdukId: 2,
        deskripsiProduk: 'Beras merah sehat, ditanam tanpa pestisida',
        stock: 200,
      },
      {
        namaProduk: 'Coklat Fermentasi',
        fotoProduk: 'coklat-fermentasi.jpg',
        jenisProdukId: 3,
        deskripsiProduk: 'Coklat biji pilihan fermentasi 7 hari',
        stock: 50,
      },
    ])
  }
}
