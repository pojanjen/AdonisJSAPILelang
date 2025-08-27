import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kirim_wa'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menambahkan kolom 'is_pengumuman_pemenang'
      table
        .enum('is_pengumuman_pemenang', ['ya', 'tidak'])
        .notNullable()
        .defaultTo('tidak')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menghapus kolom 'is_pengumuman_pemenang'
      table.dropColumn('is_pengumuman_pemenang')
    })
  }
}
