import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wa_info_lelang'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Kolom untuk mendukung factory dan sistem WA yang lebih lengkap
      table.integer('lelang_id').unsigned().nullable().references('id').inTable('lelang').onDelete('SET NULL')
      table.string('wa_number').nullable()
      table.text('wa_message').nullable()
      table.string('wa_status').nullable()
      table.string('info_type').nullable()
      table.text('additional_data').nullable()
      table.timestamp('sent_at').nullable()
      table.text('error_message').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('lelang_id')
      table.dropColumn('wa_number')
      table.dropColumn('wa_message')
      table.dropColumn('wa_status')
      table.dropColumn('info_type')
      table.dropColumn('additional_data')
      table.dropColumn('sent_at')
      table.dropColumn('error_message')
    })
  }
}
