import factory from '@adonisjs/lucid/factories'
import Lelang from '#models/lelang'

export const LelangFactory = factory
  .define(Lelang, async ({ faker }) => {
    return {}
  })
  .build()