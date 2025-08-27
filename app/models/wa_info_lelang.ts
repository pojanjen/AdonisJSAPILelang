import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Pembeli from '#models/pembeli'

export default class WaInfoLelang extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'wa_info_lelang'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public pembeliId!: number

  @column()
  public pesanKirimWa!: string | null

  // Setara dengan $casts = ['waktu_kirim_wa' => 'datetime']
  @column.dateTime()
  public waktuKirimWa!: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: WaInfoLelang belongs to Pembeli
   */
  @belongsTo(() => Pembeli)
  public pembeli!: BelongsTo<typeof Pembeli>
}
