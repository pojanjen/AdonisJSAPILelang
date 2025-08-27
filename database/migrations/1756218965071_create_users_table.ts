import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Laravel-style migration - semua tabel auth dalam 1 file
 * Untuk pengujian performa yang fair antara Laravel vs AdonisJS
 * 
 * Equivalen dengan Laravel migration:
 * - users
 * - password_reset_tokens  
 * - sessions
 */
export default class extends BaseSchema {

  async up() {
    /**
     * Tabel 1: users
     * Identik dengan Laravel: users table
     */
    this.schema.createTable('users', (table) => {
      table.increments('id')  // Laravel: $table->id()
      table.string('name').notNullable()  // Laravel: $table->string('name')
      table.string('email', 254).notNullable().unique()  // Laravel: $table->string('email')->unique()
      table.timestamp('email_verified_at').nullable()  // Laravel: $table->timestamp('email_verified_at')->nullable()
      table.string('password').notNullable()  // Laravel: $table->string('password')
      table.string('remember_token', 100).nullable()  // Laravel: $table->rememberToken()
      
      table.timestamp('created_at').notNullable().defaultTo(this.now())  // Laravel: $table->timestamps() part 1
      table.timestamp('updated_at').notNullable().defaultTo(this.now())  // Laravel: $table->timestamps() part 2
    })

    /**
     * Tabel 2: password_reset_tokens
     * Identik dengan Laravel: password_reset_tokens table
     */
    this.schema.createTable('password_reset_tokens', (table) => {
      table.string('email').primary()  // Laravel: $table->string('email')->primary()
      table.string('token').notNullable()  // Laravel: $table->string('token')
      table.timestamp('created_at').nullable()  // Laravel: $table->timestamp('created_at')->nullable()
    })

    /**
     * Tabel 3: sessions
     * Identik dengan Laravel: sessions table
     */
    this.schema.createTable('sessions', (table) => {
      table.string('id').primary()  // Laravel: $table->string('id')->primary()
      table.integer('user_id').unsigned().nullable().index()  // Laravel: $table->foreignId('user_id')->nullable()->index()
      table.string('ip_address', 45).nullable()  // Laravel: $table->string('ip_address', 45)->nullable()
      table.text('user_agent').nullable()  // Laravel: $table->text('user_agent')->nullable()
      table.text('payload', 'longtext')  // Laravel: $table->longText('payload')
      table.integer('last_activity').index()  // Laravel: $table->integer('last_activity')->index()
      
      // Foreign key constraint - sama seperti Laravel
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  /**
   * Reverse the migrations - identik dengan Laravel
   * Drop dalam urutan terbalik untuk menghindari FK constraint errors
   */
  async down() {
    this.schema.dropTable('sessions')  // Laravel: Schema::dropIfExists('sessions')
    this.schema.dropTable('password_reset_tokens')  // Laravel: Schema::dropIfExists('password_reset_tokens')
    this.schema.dropTable('users')  // Laravel: Schema::dropIfExists('users')
  }
}
