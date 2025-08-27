import { DateTime } from 'luxon'
import type {HasMany} from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany} from '@adonisjs/lucid/orm'
import Produk from './produk.js'

export default class JenisProduk extends BaseModel {

  public static table = 'jenis_produk' // Menetapkan nama tabel secara eksplisit

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nama_jenis_produk: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Produk)
  declare produk: HasMany<typeof Produk>
}
