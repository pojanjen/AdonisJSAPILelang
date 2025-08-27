import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Lelang from '#models/lelang'

export default class FotoProdukLelang extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit agar sama dengan di Laravel.
   * Jika ini tidak diatur, AdonisJS akan mengasumsikan nama tabelnya 'foto_produk_lelangs'.
   */
  public static table = 'foto_produk_lelang'

  @column({ isPrimary: true })
  public id!: number

  // 'lelang_id' di database akan otomatis terhubung ke properti 'lelangId' ini.
  @column()
  public lelangId!: number

  // 'foto'
  @column()
  public foto!: string

  // 'keterangan'
  @column()
  public keterangan!: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  /**
   * Relasi: Foto produk lelang belongs to lelang.
   * Ini setara dengan public function lelang() di Laravel.
   */
  @belongsTo(() => Lelang)
  public lelang!: BelongsTo<typeof Lelang>
}
