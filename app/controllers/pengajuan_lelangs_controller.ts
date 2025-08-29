import type { HttpContext } from '@adonisjs/core/http'
import PengajuanLelang from '#models/pengajuan_lelang'
import Lelang from '#models/lelang'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export default class PengajuanLelangsController {
  /**
   * Menampilkan semua pengajuan lelang.
   */
  public async index({ response }: HttpContext) {
    try {
      const pengajuans = await PengajuanLelang.query()
        .preload('lelang', (q) => q.preload('produk'))
        .preload('user')
        .preload('pembayaranLelang')

      return response.ok({
        success: true,
        message: 'Data pengajuan lelang berhasil diambil',
        data: pengajuans,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data pengajuan lelang',
        error: error.message,
      })
    }
  }

  /**
   * Mengajukan penawaran lelang baru.
   */
  public async store({ request, auth, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const validator = vine.compile(
        vine.object({
          lelangId: vine.number().exists(async (db, v) => !!(await db.from('lelang').where('id', v).first())),
          hargaPenawaran: vine.number().min(0),
        })
      )
      const payload = await request.validateUsing(validator)
      const user = auth.getUserOrFail()

      const lelang = await Lelang.findOrFail(payload.lelangId)

      if (lelang.status !== 'dibuka') {
        return response.badRequest({ success: false, message: 'Lelang sudah tidak aktif' })
      }
      if (payload.hargaPenawaran < lelang.hargaAwal) {
        return response.badRequest({
          success: false,
          message: 'Harga penawaran harus lebih tinggi dari harga awal',
        })
      }
      const step = 250
      if (payload.hargaPenawaran % step !== 0) {
        return response.unprocessableEntity({
          success: false,
          message: `Nominal harus kelipatan ${step}`,
        })
      }

      // Gunakan transaksi dari sini
      lelang.useTransaction(trx)

      const pengajuan = await PengajuanLelang.create(
        {
          lelangId: payload.lelangId,
          userId: user.id,
          hargaPenawaran: payload.hargaPenawaran,
          isPemenang: 'tidak',
        },
        { client: trx }
      )

      // Hitung harga tertinggi baru
      const latestIdSubquery = db
        .from('pengajuan_lelang')
        .select(db.raw('MAX(id) as id'))
        .where('lelang_id', lelang.id)
        .groupBy('user_id')

      const highestResult = await db
        .from('pengajuan_lelang')
        .whereIn('id', latestIdSubquery)
        .max('harga_penawaran as max_price')
        .first()

      const highestBid = Number(highestResult?.max_price || 0)
      lelang.hargaAkhir = Math.max(highestBid, lelang.hargaAwal)
      await lelang.save()

      await trx.commit()

      await pengajuan.load('lelang', (q) => q.preload('produk'))
      await pengajuan.load('user')

      logger.info(`BID SUCCESS: pengajuan_id ${pengajuan.id}`)

      return response.created({
        success: true,
        message: 'Penawaran disimpan',
        data: pengajuan,
      })
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error }, 'BID FAILED:')
      return response.badRequest({
        success: false,
        message: 'Gagal mengajukan penawaran',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan pengajuan berdasarkan ID lelang.
   */
  public async byLelang({ params, response }: HttpContext) {
    try {
      const pengajuans = await PengajuanLelang.query()
        .where('lelangId', params.lelangId)
        .preload('user')
        .preload('pembayaranLelang')
        .orderBy('hargaPenawaran', 'desc')

      return response.ok({
        success: true,
        message: 'Data pengajuan lelang berhasil diambil',
        data: pengajuans,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data pengajuan lelang',
        error: error.message,
      })
    }
  }

  /**
   * Menentukan pemenang lelang.
   */
  public async setPemenang({ params, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const pengajuan = await PengajuanLelang.findOrFail(params.id, { client: trx })

      // Reset semua pengajuan pada lelang ini
      await PengajuanLelang.query({ client: trx })
        .where('lelangId', pengajuan.lelangId)
        .update({ isPemenang: 'tidak' })

      // Set pengajuan ini sebagai pemenang
      pengajuan.isPemenang = 'ya'
      await pengajuan.save()

      // Update status lelang menjadi selesai
      await pengajuan.load('lelang')
      pengajuan.lelang.status = 'selesai'
      await pengajuan.lelang.save()

      await trx.commit()

      return response.ok({
        success: true,
        message: 'Pemenang berhasil ditentukan',
        data: pengajuan,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        success: false,
        message: 'Gagal menentukan pemenang',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu pengajuan.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const pengajuan = await PengajuanLelang.query()
        .where('id', params.id)
        .preload('lelang', (q) => q.preload('produk'))
        .preload('user')
        .preload('pembayaranLelang')
        .firstOrFail()

      return response.ok({
        success: true,
        message: 'Data pengajuan berhasil diambil',
        data: pengajuan,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Pengajuan tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Mengambil bid terakhir user pada lelang tertentu.
   */
  public async myLastBid({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const pengajuan = await PengajuanLelang.query()
        .where('lelangId', params.lelangId)
        .where('userId', user.id)
        .preload('lelang', (q) => q.preload('produk'))
        .preload('user')
        .orderBy('createdAt', 'desc')
        .first()

      if (!pengajuan) {
        return response.notFound({
          success: false,
          message: 'Belum ada pengajuan untuk lelang ini',
        })
      }

      return response.ok({
        success: true,
        message: 'Data pengajuan terakhir berhasil diambil',
        data: pengajuan,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data pengajuan',
        error: error.message,
      })
    }
  }

  public async history({ request, auth, response }: HttpContext) {
    try {
      const limit = request.input('limit', 50)
      const userId = auth.user?.id

      if (!userId) {
        return response.unauthorized({
          success: false,
          message: 'User belum login',
        })
      }

      // summary
      const totalLelang = await PengajuanLelang.query().where('userId', userId).count('* as total')
      const totalMenang = await PengajuanLelang.query()
        .where('userId', userId)
        .where('isPemenang', 'ya')
        .count('* as total')

      const totalLelangCount = Number(totalLelang[0].$extras.total)
      const totalMenangCount = Number(totalMenang[0].$extras.total)
      const totalKalah = totalLelangCount - totalMenangCount

      const summary = {
        total_lelang_diikuti: totalLelangCount,
        total_menang: totalMenangCount,
        total_kalah: totalKalah,
      }

      // history list
      const historyData = await PengajuanLelang.query()
        .where('userId', userId)
        .preload('lelang', (lelangQuery) => {
          lelangQuery.preload('produk')
        })
        .preload('user')
        .orderBy('createdAt', 'desc')
        .limit(limit)

      const history = await Promise.all(
        historyData.map(async (pengajuan) => {
          const winningBid = await PengajuanLelang.query()
            .where('isPemenang', 'ya')
            .where('lelangId', pengajuan.lelangId)
            .first()

          const hargaPemenang = winningBid?.hargaPenawaran ?? pengajuan.lelang.hargaAkhir

          return {
            id: pengajuan.id,
            lelang: pengajuan.lelang,
            user: pengajuan.user,
            harga_penawaran: pengajuan.hargaPenawaran,
            harga_pemenang: hargaPemenang,
            status: pengajuan.isPemenang === 'ya' ? 'Menang' : 'Kalah',
          }
        })
      )

      return response.ok({
        success: true,
        message: 'Riwayat berhasil diambil',
        summary,
        data: history,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil riwayat pengajuan',
        error: error.message,
      })
    }
  }

  /**
   * Menghapus pengajuan lelang.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const pengajuan = await PengajuanLelang.findOrFail(params.id)
      await pengajuan.delete()

      return response.ok({
        success: true,
        message: 'Pengajuan berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus pengajuan',
        error: error.message,
      })
    }
  }
}
