import factory from '@adonisjs/lucid/factories'
import Petani from '#models/petani'

export const PetaniFactory = factory
  .define(Petani, async ({ faker }) => {
    return {}
  })
  .build()