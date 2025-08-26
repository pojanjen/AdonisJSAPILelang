import factory from '@adonisjs/lucid/factories'
import JenisProduk from '#models/jenis_produk'

export const JenisProdukFactory = factory
  .define(JenisProduk, async ({ faker }) => {
    return {}
  })
  .build()