import type { HttpContext } from '@adonisjs/core/http'
import Petani from '#models/petani'
import vine from '@vinejs/vine'

export default class PetanisController {
  /**
   * Menampilkan semua data petani.
   */
  public async index({ response }: HttpContext) {
    try {
      const petanis = await Petani.query().preload('penerimaanProduk')
      return response.ok({
        success: true,
        message: 'Data petani berhasil diambil',
        data: petanis,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data petani',
        error: error.message,
      })
    }
  }

  /**
   * Menambah petani baru.
   */
  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          namaPetani: vine.string().maxLength(255),
          alamatPetani: vine.string(),
          teleponPetani: vine.string().maxLength(20),
          nomorRekening: vine.string().maxLength(50).optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      const petani = await Petani.create(payload)

      return response.created({
        success: true,
        message: 'Petani berhasil ditambahkan',
        data: petani,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal menambah petani',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu petani.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const petani = await Petani.findOrFail(params.id)
      await petani.load('penerimaanProduk', (penerimaanQuery) => {
        penerimaanQuery.preload('produk').preload('lelang')
      })

      return response.ok({
        success: true,
        message: 'Data petani berhasil diambil',
        data: petani,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Petani tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui data petani.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const petani = await Petani.findOrFail(params.id)

      const validator = vine.compile(
        vine.object({
          namaPetani: vine.string().maxLength(255),
          alamatPetani: vine.string(),
          teleponPetani: vine.string().maxLength(20),
          nomorRekening: vine.string().maxLength(50).optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      petani.merge(payload)
      await petani.save()

      return response.ok({
        success: true,
        message: 'Petani berhasil diupdate',
        data: petani,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate petani',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus data petani.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const petani = await Petani.findOrFail(params.id)
      await petani.delete()

      return response.ok({
        success: true,
        message: 'Petani berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus petani',
        error: error.message,
      })
    }
  }
}
