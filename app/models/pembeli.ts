import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import env from '#start/env'

export default class Pembeli extends BaseModel {
  /**
   * Menetapkan nama tabel secara eksplisit.
   */
  public static table = 'pembeli'

  @column({ isPrimary: true })
  public id!: number

  // Kolom-kolom dari $fillable
  @column()
  public userId!: number

  @column()
  public alamatPembeli!: string

  @column()
  public teleponPembeli!: string

  @column()
  public nomorRekening!: string | null

  @column()
  public fotoKtp!: string | null

  @column()
  public statusVerifikasi!: 'pending' | 'approved' | 'rejected'

  @column()
  public alasanPenolakan!: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  // Computed properties (equivalent to Laravel's appends)
  @computed()
  public get fotoKtpUrl(): string | null {
    if (this.fotoKtp) {
      // Use API image route for CORS-safe loading in Flutter Web
      const baseUrl = env.get('APP_URL', 'http://localhost:3333')
      return `${baseUrl}/public/image/${this.fotoKtp}`
    }
    return null
  }

  @computed()
  public get isPending(): boolean {
    return this.statusVerifikasi === 'pending'
  }

  @computed()
  public get isApproved(): boolean {
    return this.statusVerifikasi === 'approved'
  }

  @computed()
  public get isRejected(): boolean {
    return this.statusVerifikasi === 'rejected'
  }

  // Helper methods
  public hasKtpPhoto(): boolean {
    return !!(this.fotoKtp && this.fotoKtp.trim().length > 0)
  }

  public canDisplayKtpImage(): boolean {
    return !!(this.fotoKtp && this.fotoKtp.trim().length > 0)
  }

  /**
   * Relasi: Pembeli belongs to User
   */
  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>
}
