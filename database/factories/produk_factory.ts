import factory from '@adonisjs/lucid/factories'
import Produk from '#models/produk'

export const ProdukFactory = factory
  .define(Produk, async ({ faker }) => {
    return {}
  })
  .build()