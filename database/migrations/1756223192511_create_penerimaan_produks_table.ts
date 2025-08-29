import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'penerimaan_produk'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys - akan ditambahkan di migrasi terpisah setelah semua tabel dibuat
      table.integer('produk_id').unsigned()
      table.integer('petani_id').unsigned()
      table.integer('lelang_id').unsigned()

      table.integer('jumlah').notNullable()
      table.timestamp('tanggal_penerimaan', { useTz: true }).notNullable()
      table.float('harga_per_unit').notNullable()

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
