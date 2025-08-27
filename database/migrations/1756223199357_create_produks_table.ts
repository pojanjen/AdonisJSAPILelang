import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'produk'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nama_produk').notNullable()
      table.string('foto_produk').nullable()

      // Setara dengan: $table->foreignId('jenis_produk_id')->constrained('jenis_produk');
      // Asumsi nama tabelnya 'jenis_produks' (plural)
      table
        .integer('jenis_produk_id')
        .unsigned()
        .references('id')
        .inTable('jenis_produks')
        .onDelete('CASCADE')

      table.text('deskripsi_produk').notNullable()
      table.float('stock').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
