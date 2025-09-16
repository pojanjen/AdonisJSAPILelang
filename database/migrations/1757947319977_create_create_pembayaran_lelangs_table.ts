import { BaseSchema } from '@adonisjs/lucid/schema'

export default class PembayaranLelang extends BaseSchema {
  protected tableName = 'pembayaran_lelangs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // foreign key ke pengajuan_lelang.id
      table
        .integer('pengajuan_lelang_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pengajuan_lelang')
        .onDelete('CASCADE')

      // catatan: untuk nilai uang, pertimbangkan DECIMAL agar presisi
      table.float('jumlah_pembayaran').notNullable()
      // alternatif yang lebih aman untuk uang:
      // table.decimal('jumlah_pembayaran', 12, 2).notNullable()

      table.date('tanggal_pembayaran').notNullable()
      table.string('bukti_pembayaran').notNullable()

      table
        .enu('status_pembayaran', ['pending', 'lunas', 'belum_lunas', 'ditolak'])
        .notNullable()
        .defaultTo('pending')

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
