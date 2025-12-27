import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Nama tabel di Laravel adalah 'lelang', kita sesuaikan di sini.
  // Konvensi AdonisJS biasanya 'lelangs' (plural).
  protected tableName = 'lelang'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nama_lelang').notNullable()

      // Foreign key akan ditambahkan nanti setelah tabel produks dibuat
      table.integer('produk_id').unsigned().nullable()

      table.integer('harga_awal').notNullable()
      table.integer('harga_akhir').nullable()
      table.timestamp('tanggal_mulai').nullable()
      table.timestamp('tanggal_selesai').nullable()
      table.integer('total_stock').notNullable().defaultTo(0)
      table
        .enum('status', ['dibuka', 'ditutup', 'selesai'])
        .notNullable()
        .defaultTo('dibuka')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
