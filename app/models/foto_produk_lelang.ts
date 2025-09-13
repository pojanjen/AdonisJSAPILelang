import { BaseModel, column, belongsTo, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Lelang from '#models/lelang'

export default class FotoProdukLelang extends BaseModel {
  public static table = 'foto_produk_lelang' // Menetapkan nama tabel secara eksplisit

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'lelang_id' })
  declare lelangId: number

  @column()
  declare foto: string | null

  @column()
  declare keterangan: string | null

  @belongsTo(() => Lelang, { foreignKey: 'lelangId' })
  declare lelang: BelongsTo<typeof Lelang>

  @computed()
  public get fotoUrl() {
    if (!this.foto) return null
    const appUrl = process.env.APP_URL ?? 'http://localhost:3333'
    return `${appUrl}/api/public/image/${this.foto}`
  }
}
