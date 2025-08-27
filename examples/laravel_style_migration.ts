import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * CONTOH: Migrasi gaya Laravel - semua tabel auth dalam 1 file
 * 
 * Ini adalah contoh bagaimana migrasi Laravel yang Anda berikan
 * bisa dikonversi menjadi 1 file migrasi di AdonisJS
 */
export default class CreateAuthTables extends BaseSchema {

  async up(): void {
    // Tabel 1: Users (updated version)
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.timestamp('email_verified_at').nullable()
      table.string('password').notNullable()
      table.string('remember_token', 100).nullable()
      
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    // Tabel 2: Password Reset Tokens
    this.schema.createTable('password_reset_tokens', (table) => {
      table.string('email').primary()
      table.string('token').notNullable()
      table.timestamp('created_at').nullable()
      
      // Index untuk performa
      table.index(['email', 'token'])
    })

    // Tabel 3: Sessions
    this.schema.createTable('sessions', (table) => {
      table.string('id').primary()
      table.integer('user_id').unsigned().nullable().index()
      table.string('ip_address', 45).nullable()
      table.text('user_agent').nullable()
      table.text('payload', 'longtext').notNullable()
      table.integer('last_activity').index()
      
      // Foreign key ke users
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down(): void {
    // Drop dalam urutan terbalik untuk menghindari FK constraint errors
    this.schema.dropTable('sessions')
    this.schema.dropTable('password_reset_tokens')
    this.schema.dropTable('users')
  }
}

/**
 * PERBANDINGAN:
 * 
 * Laravel (PHP):
 * Schema::create('users', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->string('email')->unique();
 *     $table->timestamp('email_verified_at')->nullable();
 *     $table->string('password');
 *     $table->rememberToken();
 *     $table->timestamps();
 * });
 * 
 * AdonisJS (TypeScript):
 * this.schema.createTable('users', (table) => {
 *   table.increments('id')
 *   table.string('name').notNullable()
 *   table.string('email', 254).notNullable().unique()
 *   table.timestamp('email_verified_at').nullable()
 *   table.string('password').notNullable()
 *   table.string('remember_token', 100).nullable()
 *   
 *   table.timestamp('created_at').notNullable().defaultTo(this.now())
 *   table.timestamp('updated_at').notNullable().defaultTo(this.now())
 * })
 * 
 * KESAMAAN:
 * ✅ Semua tabel auth dalam 1 file
 * ✅ Atomic operation
 * ✅ Urutan yang terjamin
 * ✅ Mudah rollback bersamaan
 * 
 * PERBEDAAN:
 * ❌ Laravel: $table->timestamps() otomatis
 * ✅ AdonisJS: Harus explicit untuk timestamp defaults
 * ❌ Laravel: $table->rememberToken() otomatis
 * ✅ AdonisJS: Harus explicit dengan string('remember_token', 100)
 */
