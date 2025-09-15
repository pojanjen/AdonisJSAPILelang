import type { HttpContext } from '@adonisjs/core/http'
import FotoProdukLelang from '#models/foto_produk_lelang'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import vine from '@vinejs/vine' // Impor vine untuk validasi inline

export default class FotoProdukLelangsController {
  /**
   * Menampilkan semua foto produk lelang.
   */
  public async index({ response }: HttpContext) {
    try {
      const fotos = await FotoProdukLelang.query().preload('lelang', (lelangQuery) => {
        lelangQuery.preload('produk')
      })

      return response.ok({
        success: true,
        message: 'Data foto produk lelang berhasil diambil',
        data: fotos,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data foto produk lelang',
        error: error.message,
      })
    }
  }

  /**
   * Menambah foto produk lelang baru dengan validasi internal.
   */
  public async store({ request, response }: HttpContext) {
    try {
      // Skema validasi didefinisikan langsung di dalam metode
      const validator = vine.compile(
        vine.object({
          lelangId: vine.number().exists(async (db, value) => {
            const lelang = await db.from('lelangs').where('id', value).first()
            return !!lelang
          }),
          foto: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png', 'gif'],
          }),
          keterangan: vine.string().optional(),
        })
      )

      // Validasi input
      const payload = await request.validateUsing(validator)

      // Pindahkan file yang di-upload
      await payload.foto.move(app.makePath('public/uploads/lelang'))

      // Buat data baru di database
      const foto = await FotoProdukLelang.create({
        lelangId: payload.lelangId,
        foto: `uploads/lelang/${payload.foto.fileName}`,
        keterangan: payload.keterangan,
      })

      await foto.load('lelang', (lelangQuery) => lelangQuery.preload('produk'))

      return response.created({
        success: true,
        message: 'Foto produk lelang berhasil ditambahkan',
        data: foto,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menambah foto produk lelang',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan foto berdasarkan ID lelang.
   */
  public async byLelang({ params, response }: HttpContext) {
    try {
      console.log(`Mencari foto untuk lelang ID: ${params.lelangId}`)

      const fotos = await FotoProdukLelang.query()
        .where('lelangId', params.lelangId)
        .preload('lelang', (lelangQuery) => {
          lelangQuery.preload('produk')
        })

      console.log(`Ditemukan ${fotos.length} foto untuk lelang ID: ${params.lelangId}`)

      return response.ok({
        success: true,
        message: 'Data foto produk lelang berhasil diambil',
        data: fotos,
      })
    } catch (error) {
      console.error(`Error saat mengambil foto untuk lelang ID ${params.lelangId}:`, error)
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data foto produk lelang',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui foto produk lelang dengan validasi internal.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const foto = await FotoProdukLelang.findOrFail(params.id)

      // Skema validasi didefinisikan langsung di dalam metode
      const validator = vine.compile(
        vine.object({
          lelangId: vine.number().exists(async (db, value) => {
            const lelang = await db.from('lelangs').where('id', value).first()
            return !!lelang
          }),
          foto: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png', 'gif'],
          }).optional(),
          keterangan: vine.string().optional(),
        })
      )

      // Validasi input
      const payload = await request.validateUsing(validator)

      let fotoPath = foto.foto

      if (payload.foto) {
        if (foto.foto) {
          await fs.unlink(app.makePath(`public/${foto.foto}`))
        }
        await payload.foto.move(app.makePath('public/uploads/lelang'))
        fotoPath = `uploads/lelang/${payload.foto.fileName}`
      }

      foto.merge({
        lelangId: payload.lelangId,
        foto: fotoPath,
        keterangan: payload.keterangan,
      })
      await foto.save()

      return response.ok({
        success: true,
        message: 'Foto produk lelang berhasil diupdate',
        data: foto,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate foto produk lelang',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus foto produk lelang.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const foto = await FotoProdukLelang.findOrFail(params.id)

      if (foto.foto) {
        await fs.unlink(app.makePath(`public/${foto.foto}`))
      }

      await foto.delete()

      return response.ok({
        success: true,
        message: 'Foto produk lelang berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus foto produk lelang',
        error: error.message,
      })
    }
  }
}
