import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import JenisProduk from '#models/jenis_produk'
import Lelang from '#models/lelang'
import PenerimaanProduk from '#models/penerimaan_produk'
import FotoProdukLelang from '#models/foto_produk_lelang'

export default class Produk extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'produk'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public namaProduk!: string

  @column()
  public fotoProduk!: string | null

  @column()
  public jenisProdukId!: number

  @column()
  public deskripsiProduk!: string

  @column()
  public stock!: number

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: Produk belongs to JenisProduk
   */
  @belongsTo(() => JenisProduk)
  public jenisProduk!: BelongsTo<typeof JenisProduk>

  /**
   * Relasi: Produk has many Lelang
   */
  @hasMany(() => Lelang)
  public lelang!: HasMany<typeof Lelang>

  /**
   * Relasi: Produk has many PenerimaanProduk
   */
  @hasMany(() => PenerimaanProduk)
  public penerimaanProduk!: HasMany<typeof PenerimaanProduk>

  /**
   * Relasi: Produk has many FotoProdukLelang
   */
  @hasMany(() => FotoProdukLelang, { foreignKey: 'lelangId' })
  public fotoProdukLelang!: HasMany<typeof FotoProdukLelang>
}
