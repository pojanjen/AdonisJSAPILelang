import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pembeli'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Setara dengan: $table->foreignId('user_id')->constrained('users');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.string('alamat_pembeli').notNullable()
      table.string('telepon_pembeli').notNullable()

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
