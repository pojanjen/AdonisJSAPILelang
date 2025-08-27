import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'petani'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menambahkan kolom-kolom baru
      table.string('nomor_rekening').nullable()
      table.string('nama_pemilik_rekening').nullable()
      table.string('nama_bank').nullable()
      table.string('foto_ktp').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menghapus kolom-kolom yang ditambahkan
      table.dropColumn('nomor_rekening')
      table.dropColumn('nama_pemilik_rekening')
      table.dropColumn('nama_bank')
      table.dropColumn('foto_ktp')
    })
  }
}
