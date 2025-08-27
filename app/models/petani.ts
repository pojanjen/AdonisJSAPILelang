import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PenerimaanProduk from '#models/penerimaan_produk'

export default class Petani extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'petani'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public namaPetani!: string

  @column()
  public alamatPetani!: string

  @column()
  public teleponPetani!: string

  @column()
  public nomorRekening!: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: Petani has many PenerimaanProduk
   */
  @hasMany(() => PenerimaanProduk)
  public penerimaanProduk!: HasMany<typeof PenerimaanProduk>
}
