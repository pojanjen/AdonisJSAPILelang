import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Produk from '#models/produk'
import Petani from '#models/petani'
import Lelang from '#models/lelang'

export default class PenerimaanProduk extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'penerimaan_produk'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public produkId!: number

  @column()
  public petaniId!: number

  @column()
  public jumlah!: number

  @column()
  public hargaPerUnit!: number

  @column()
  public lelangId!: number

  // Setara dengan $casts = ['tanggal_penerimaan' => 'datetime']
  @column.dateTime()
  public tanggalPenerimaan!: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: PenerimaanProduk belongs to Produk
   */
  @belongsTo(() => Produk)
  public produk!: BelongsTo<typeof Produk>

  /**
   * Relasi: PenerimaanProduk belongs to Petani
   */
  @belongsTo(() => Petani)
  public petani!: BelongsTo<typeof Petani>

  /**
   * Relasi: PenerimaanProduk belongs to Lelang
   */
  @belongsTo(() => Lelang)
  public lelang!: BelongsTo<typeof Lelang>
}
