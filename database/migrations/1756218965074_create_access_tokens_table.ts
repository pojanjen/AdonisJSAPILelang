import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Morph relation
      table.string('tokenable_type').notNullable().defaultTo('users')
      table
        .integer('tokenable_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type').notNullable().defaultTo('auth:api')
      table.string('name').nullable()

      table.string('hash').notNullable().unique()
      table.json('abilities').nullable()

      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['tokenable_type', 'tokenable_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
