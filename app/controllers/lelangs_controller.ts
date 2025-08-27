import type { HttpContext } from '@adonisjs/core/http'
import Lelang from '#models/lelang'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'

export default class LelangsController {
  /**
   * Menampilkan semua data lelang dengan relasi.
   * Setara dengan: Lelang::with('produk.jenisProduk', 'pengajuanLelang.user', 'penerimaanProduk.petani')->get();
   */
  public async index({ response }: HttpContext) {
    try {
      const lelangs = await Lelang.query()
        .preload('produk', (produkQuery) => produkQuery.preload('jenisProduk'))
        .preload('pengajuanLelang', (pengajuanQuery) => pengajuanQuery.preload('user'))
        .preload('penerimaanProduk', (penerimaanQuery) => penerimaanQuery.preload('petani'))

      return response.ok({
        success: true,
        message: 'Data lelang berhasil diambil',
        data: lelangs,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data lelang',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan lelang yang sedang berlangsung.
   */
  public async active({ response }: HttpContext) {
    try {
      const now = DateTime.now()
      const lelangs = await Lelang.query()
        .preload('produk', (produkQuery) => produkQuery.preload('jenisProduk'))
        .preload('pengajuanLelang', (pengajuanQuery) => pengajuanQuery.preload('user'))
        .where('status', 'dibuka')
        .where('tanggal_mulai', '<=', now.toSQL())
        .where('tanggal_selesai', '>=', now.toSQL())

      return response.ok({
        success: true,
        message: 'Data lelang aktif berhasil diambil',
        data: lelangs,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data lelang aktif',
        error: error.message,
      })
    }
  }

  /**
   * Menambah lelang baru.
   */
  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          namaLelang: vine.string().maxLength(255),
          produkId: vine.number().exists(async (db, value) => !!(await db.from('produks').where('id', value).first())),
          hargaAwal: vine.number().min(0),
          tanggalMulai: vine.date().after('today'),
          tanggalSelesai: vine.date().afterField('tanggalMulai'),
          totalStock: vine.number().min(0).optional(),
        })
      )

      const payload = await request.validateUsing(validator)

      const lelang = await Lelang.create({
        ...payload,
        status: 'dibuka',
        tanggalMulai: DateTime.fromJSDate(payload.tanggalMulai),
        tanggalSelesai: DateTime.fromJSDate(payload.tanggalSelesai),
      })

      await lelang.load('produk', (q) => q.preload('jenisProduk'))

      return response.created({
        success: true,
        message: 'Lelang berhasil ditambahkan',
        data: lelang,
      })
    } catch (error) {
        return response.badRequest({
            success: false,
            message: 'Gagal menambah lelang',
            error: error.messages || error.message,
        })
    }
  }

  /**
   * Menampilkan detail satu lelang.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const lelang = await Lelang.findOrFail(params.id)

      // Load semua relasi yang dibutuhkan
      await lelang.load('produk', (q) => q.preload('jenisProduk'))
      await lelang.load('pengajuanLelang', (q) => q.preload('user'))
      await lelang.load('penerimaanProduk', (q) => q.preload('petani'))
      await lelang.load('fotoProdukLelang')

      return response.ok({
        success: true,
        message: 'Data lelang berhasil diambil',
        data: lelang,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Lelang tidak ditemukan atau gagal mengambil data',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui data lelang.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
        const lelang = await Lelang.findOrFail(params.id)

        const validator = vine.compile(
            vine.object({
                namaLelang: vine.string().maxLength(255),
                produkId: vine.number().exists(async (db, value) => !!(await db.from('produks').where('id', value).first())),
                hargaAwal: vine.number().min(0),
                hargaAkhir: vine.number().min(0).optional(),
                tanggalMulai: vine.date().transform((value) => DateTime.fromJSDate(value)),
                tanggalSelesai: vine.date().afterField('tanggalMulai')
                  .transform((value) => DateTime.fromJSDate(value)),
                totalStock: vine.number().min(0).optional(),
                status: vine.enum(['dibuka', 'ditutup', 'selesai']).optional(),
            })
        )

        const payload = await request.validateUsing(validator)

        lelang.merge(payload)
        await lelang.save()

        await lelang.load('produk', (q) => q.preload('jenisProduk'))

        return response.ok({
            success: true,
            message: 'Lelang berhasil diupdate',
            data: lelang,
        })
    } catch (error) {
        return response.badRequest({
            success: false,
            message: 'Gagal mengupdate lelang',
            error: error.messages || error.message,
        })
    }
  }

  /**
   * Menutup lelang (mengubah status).
   */
  public async close({ params, response }: HttpContext) {
    try {
        const lelang = await Lelang.findOrFail(params.id)

        lelang.status = 'ditutup'
        await lelang.save()

        return response.ok({
            success: true,
            message: 'Lelang berhasil ditutup',
            data: lelang,
        })
    } catch (error) {
        return response.internalServerError({
            success: false,
            message: 'Gagal menutup lelang',
            error: error.message,
        })
    }
  }

  /**
   * Menghapus data lelang.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
        const lelang = await Lelang.findOrFail(params.id)
        await lelang.delete()

        return response.ok({
            success: true,
            message: 'Lelang berhasil dihapus',
        })
    } catch (error) {
        return response.internalServerError({
            success: false,
            message: 'Gagal menghapus lelang',
            error: error.message,
        })
    }
  }
}
