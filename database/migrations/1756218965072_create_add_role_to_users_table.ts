import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menambahkan kolom 'role' setelah kolom 'password'
      table
        .enum('role', ['admin', 'pembeli'])
        .notNullable()
        .defaultTo('pembeli')
        .after('password')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })
  }
}
