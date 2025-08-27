import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Lelang from '#models/lelang'
import User from '#models/user'
import PembayaranLelang from '#models/pembayaran_lelang'

export default class PengajuanLelang extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'pengajuan_lelang'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public lelangId!: number

  @column()
  public userId!: number

  @column()
  public hargaPenawaran!: number

  @column()
  public isPemenang!: 'ya' | 'tidak'

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: PengajuanLelang belongs to Lelang
   */
  @belongsTo(() => Lelang)
  public lelang!: BelongsTo<typeof Lelang>

  /**
   * Relasi: PengajuanLelang belongs to User
   */
  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>

  /**
   * Relasi: PengajuanLelang has one PembayaranLelang
   */
  @hasOne(() => PembayaranLelang)
  public pembayaranLelang!: HasOne<typeof PembayaranLelang>
}
