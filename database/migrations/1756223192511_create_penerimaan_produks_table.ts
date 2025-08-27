import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'penerimaan_produk'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign keys
      table.integer('produk_id').unsigned().references('id').inTable('produks').onDelete('CASCADE')
      table.integer('petani_id').unsigned().references('id').inTable('petanis').onDelete('CASCADE')
      table.integer('lelang_id').unsigned().references('id').inTable('lelangs').onDelete('CASCADE')

      table.integer('jumlah').notNullable()
      table.timestamp('tanggal_penerimaan', { useTz: true }).notNullable()
      table.float('harga_per_unit').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
