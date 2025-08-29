import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pengajuan_lelang'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign key ke tabel 'lelang'
      table.integer('lelang_id').unsigned().references('id').inTable('lelang').onDelete('CASCADE')

      // Foreign key ke tabel 'users'
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.float('harga_penawaran').notNullable()
      table.enum('is_pemenang', ['ya', 'tidak']).notNullable().defaultTo('tidak')

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
