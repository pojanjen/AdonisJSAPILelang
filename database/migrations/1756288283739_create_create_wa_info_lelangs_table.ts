import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wa_info_lelang'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Di AdonisJS, foreign key biasanya didefinisikan dengan lebih eksplisit
      // untuk memastikan integritas data.
      table.integer('pembeli_id').unsigned().references('id').inTable('pembeli').onDelete('CASCADE')

      table.timestamp('waktu_kirim_wa', { useTz: true }).nullable()
      table.text('pesan_kirim_wa').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
