import type { HttpContext } from '@adonisjs/core/http'
import JenisProduk from '#models/jenis_produk'
import vine from '@vinejs/vine'

export default class JenisProdukControllersController {
  /**
   * Menampilkan semua jenis produk.
   */
  public async index({ response }: HttpContext) {
    try {
      const jenisProduks = await JenisProduk.all()

      return response.ok({
        success: true,
        message: 'Data jenis produk berhasil diambil',
        data: jenisProduks,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data jenis produk',
        error: error.message,
      })
    }
  }

  /**
   * Menambah jenis produk baru.
   */
  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          // Di AdonisJS, nama properti umumnya camelCase
          namaJenisProduk: vine.string().maxLength(255),
        })
      )

      const payload = await request.validateUsing(validator)

      const jenisProduk = await JenisProduk.create({
        nama_jenis_produk: payload.namaJenisProduk, // Sesuaikan dengan nama kolom di model
      })

      return response.created({
        success: true,
        message: 'Jenis produk berhasil ditambahkan',
        data: jenisProduk,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal menambah jenis produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu jenis produk.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const jenisProduk = await JenisProduk.findOrFail(params.id)
      await jenisProduk.load('produk') // Setara dengan with('produk')

      return response.ok({
        success: true,
        message: 'Data jenis produk berhasil diambil',
        data: jenisProduk,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Jenis produk tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui jenis produk.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const jenisProduk = await JenisProduk.findOrFail(params.id)

      const validator = vine.compile(
        vine.object({
          namaJenisProduk: vine.string().maxLength(255),
        })
      )

      const payload = await request.validateUsing(validator)

      jenisProduk.merge({
        nama_jenis_produk: payload.namaJenisProduk,
      })
      await jenisProduk.save()

      return response.ok({
        success: true,
        message: 'Jenis produk berhasil diupdate',
        data: jenisProduk,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate jenis produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus jenis produk.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const jenisProduk = await JenisProduk.findOrFail(params.id)
      await jenisProduk.delete()

      return response.ok({
        success: true,
        message: 'Jenis produk berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus jenis produk',
        error: error.message,
      })
    }
  }
}
