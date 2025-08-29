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
  @column({ columnName: 'pembeli_id' })
  public pembeliId!: number

  @column({ columnName: 'pesan_kirim_wa' })
  public pesanKirimWa!: string | null

  // Setara dengan $casts = ['waktu_kirim_wa' => 'datetime']
  @column.dateTime({ columnName: 'waktu_kirim_wa' })
  public waktuKirimWa!: DateTime | null

  @column({ columnName: 'is_pengumuman_pemenang' })
  public isPengumumanPemenang!: 'ya' | 'tidak'

  // Kolom tambahan untuk factory
  @column({ columnName: 'lelang_id' })
  public lelangId?: number

  @column({ columnName: 'wa_number' })
  public waNumber?: string

  @column({ columnName: 'wa_message' })
  public waMessage?: string

  @column({ columnName: 'wa_status' })
  public waStatus?: string

  @column({ columnName: 'info_type' })
  public infoType?: string

  @column({ columnName: 'additional_data' })
  public additionalData?: any

  @column.dateTime({ columnName: 'sent_at' })
  public sentAt?: DateTime | null

  @column({ columnName: 'error_message' })
  public errorMessage?: string | null

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
