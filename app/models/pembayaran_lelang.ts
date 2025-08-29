import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PengajuanLelang from '#models/pengajuan_lelang'

export default class PembayaranLelang extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'pembayaran_lelangs'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public pengajuanLelangId!: number

  @column()
  public jumlahPembayaran!: number

  @column()
  public buktiPembayaran!: string

  @column()
  public statusPembayaran!: 'pending' | 'lunas' | 'belum_lunas' | 'ditolak'

  // Setara dengan $casts = ['tanggal_pembayaran' => 'date']
  @column.date()
  public tanggalPembayaran!: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  /**
   * Relasi: PembayaranLelang belongs to PengajuanLelang.
   * Ini akan memperbaiki error di controller Anda.
   */
  @belongsTo(() => PengajuanLelang)
  public pengajuanLelang!: BelongsTo<typeof PengajuanLelang>
}
