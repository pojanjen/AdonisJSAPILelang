import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import Pembeli from '#models/pembeli'
import PengajuanLelang from '#models/pengajuan_lelang'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id!: number

  @column()
  public name!: string

  @column()
  public email!: string

  @column.dateTime() // Email verification timestamp
  public emailVerifiedAt!: DateTime | null

  @column({ serializeAs: null }) // Hidden from JSON serialization
  public password!: string

  @column({ serializeAs: null }) // Remember token for "remember me" functionality
  public rememberToken!: string | null

  @column() // Role user (pembeli, petani, admin, etc.)
  public role!: string

  @column() // Google OAuth ID
  public googleId!: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  /**
   * Lifecycle hook untuk hashing password.
   * Ini setara dengan cast 'password' => 'hashed' di Laravel.
   */
  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  /**
   * Verify user credentials - Laravel equivalent: Auth::attempt()
   * Verifikasi email dan password untuk login
   */
  public static async verifyCredentials(email: string, password: string): Promise<User> {
    const user = await this.findBy('email', email)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await hash.verify(user.password, password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    return user
  }

  // --- RELASI ---

  /**
   * Relasi: User has one Pembeli
   */
  @hasOne(() => Pembeli)
  public pembeli!: HasOne<typeof Pembeli>

  /**
   * Relasi: User has many PengajuanLelang
   */
  @hasMany(() => PengajuanLelang)
  public pengajuanLelang!: HasMany<typeof PengajuanLelang>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
