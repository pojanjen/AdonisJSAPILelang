import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pembeli'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menambahkan kolom 'foto_ktp' setelah 'telepon_pembeli'
      table.string('foto_ktp').nullable().after('telepon_pembeli')

      // Menambahkan kolom 'status_verifikasi' setelah 'foto_ktp'
      table
        .enum('status_verifikasi', ['pending', 'approved', 'rejected'])
        .notNullable()
        .defaultTo('pending')
        .after('foto_ktp')

      // Menambahkan kolom 'alasan_penolakan' setelah 'status_verifikasi'
      table.text('alasan_penolakan').nullable().after('status_verifikasi')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Menghapus kolom yang ditambahkan di migrasi ini, satu per satu
      table.dropColumn('foto_ktp')
      table.dropColumn('status_verifikasi')
      table.dropColumn('alasan_penolakan')
    })
  }
}
