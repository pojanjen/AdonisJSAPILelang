import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, afterCreate, afterUpdate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Produk from '#models/produk'
import PengajuanLelang from '#models/pengajuan_lelang'
import PenerimaanProduk from '#models/penerimaan_produk'
import WaInfoLelang from '#models/wa_info_lelang'
import FotoProdukLelang from '#models/foto_produk_lelang'
import JobScheduler from '../jobs/job_scheduler.js'
import logger from '@adonisjs/core/services/logger'

export default class Lelang extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit agar sama dengan di Laravel.
   */
  public static table = 'lelang'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public namaLelang!: string

  @column()
  public produkId!: number

  @column()
  public hargaAwal!: number

  @column()
  public hargaAkhir!: number | null

  @column()
  public totalStock!: number

  @column()
  public status!: 'dibuka' | 'ditutup' | 'selesai'

  // Setara dengan $casts = ['tanggal_mulai' => 'datetime']
  @column.dateTime()
  public tanggalMulai!: DateTime

  @column.dateTime()
  public tanggalSelesai!: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // --- RELASI ---

  /**
   * Relasi: Lelang belongs to Produk
   */
  @belongsTo(() => Produk)
  public produk!: BelongsTo<typeof Produk>

  /**
   * Relasi: Lelang has many PengajuanLelang
   */
  @hasMany(() => PengajuanLelang)
  public pengajuanLelang!: HasMany<typeof PengajuanLelang>

  /**
   * Relasi: Lelang has many PenerimaanProduk
   */
  @hasMany(() => PenerimaanProduk)
  public penerimaanProduk!: HasMany<typeof PenerimaanProduk>

  /**
   * Relasi: Lelang has many WaInfoLelang
   */
  @hasMany(() => WaInfoLelang)
  public waInfoLelang!: HasMany<typeof WaInfoLelang>

  @hasMany(() => FotoProdukLelang)
  declare fotoProdukLelang: HasMany<typeof FotoProdukLelang>

  // --- EVENT LISTENERS ---

  /**
   * Event listener: Schedule close job after create
   */
  @afterCreate()
  public static async scheduleAfterCreate(lelang: Lelang) {
    lelang.scheduleCloseJob()
  }

  /**
   * Event listener: Re-schedule close job after update
   */
  @afterUpdate()
  public static async scheduleAfterUpdate(lelang: Lelang) {
    // Hanya re-schedule jika tanggal_selesai atau status berubah
    if (lelang.$dirty.tanggalSelesai || lelang.$dirty.status) {
      lelang.scheduleCloseJob()
    }
  }

  // --- INSTANCE METHODS ---

  /**
   * Jadwalkan job untuk menutup lelang otomatis
   */
  public scheduleCloseJob(): void {
    // Hanya jadwalkan jika status 'dibuka' dan tanggal_selesai masih di masa depan
    if (this.status === 'dibuka' && this.tanggalSelesai > DateTime.now()) {
      logger.info(`Scheduling close job for lelang ${this.id} to run at ${this.tanggalSelesai.toSQL()}`)

      // Schedule job dengan delay sampai tanggal_selesai
      JobScheduler.scheduleCloseAuction(this.id, this.tanggalSelesai)
    } else {
      logger.info(`Not scheduling job for lelang ${this.id} - Status: ${this.status}, End time: ${this.tanggalSelesai.toSQL()}, Now: ${DateTime.now().toSQL()}`)
    }
  }
}
