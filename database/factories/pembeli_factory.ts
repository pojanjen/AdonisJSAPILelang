import factory from '@adonisjs/lucid/factories'
import Pembeli from '#models/pembeli'

export const PembeliFactory = factory
  .define(Pembeli, async ({ faker }) => {
    return {}
  })
  .build()