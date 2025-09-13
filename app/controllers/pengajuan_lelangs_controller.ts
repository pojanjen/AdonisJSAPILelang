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
      // Validasi input
      const validator = vine.compile(
        vine.object({
          lelang_id: vine.number().exists(async (db, v) => !!(await db.from('lelang').where('id', v).first())),
          harga_penawaran: vine.number().min(0),
        })
      )
      const validated = await request.validateUsing(validator)

      const user = auth.getUserOrFail()
      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'User tidak terautentikasi',
        })
      }

      // Cek apakah lelang masih aktif
      const lelang = await Lelang.find(validated.lelang_id)
      if (!lelang) {
        return response.notFound({
          success: false,
          message: 'Lelang tidak ditemukan',
        })
      }

      if (lelang.status !== 'dibuka') {
        return response.badRequest({
          success: false,
          message: 'Lelang sudah tidak aktif',
        })
      }

      // Cek apakah harga penawaran lebih tinggi dari harga awal
      if (validated.harga_penawaran < lelang.hargaAwal) {
        return response.badRequest({
          success: false,
          message: 'Harga penawaran harus lebih tinggi dari harga awal',
        })
      }

      // Validasi step 250
      const step = 250
      if (validated.harga_penawaran % step !== 0) {
        return response.unprocessableEntity({
          success: false,
          message: `Nominal harus kelipatan ${step}`,
        })
      }

      // Buat pengajuan lelang baru
      const pengajuan = await PengajuanLelang.create(
        {
          lelangId: validated.lelang_id,
          userId: user.id,
          hargaPenawaran: validated.harga_penawaran,
          isPemenang: 'tidak',
        },
        { client: trx }
      )

      // Update harga akhir lelang
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

      const highest = Number(highestResult?.max_price || 0)

      await Lelang.query({ client: trx })
        .where('id', lelang.id)
        .update({
          harga_akhir: Math.max(highest, lelang.hargaAwal),
        })

      await trx.commit()

      // Load relasi untuk response
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

      if (error.code === 'E_VALIDATION_ERROR') {
        logger.error('BID VALIDATION ERROR:', error.messages)
        return response.unprocessableEntity({
          success: false,
          message: 'Validasi gagal',
          errors: error.messages,
        })
      }

      logger.error('BID EXCEPTION:', {
        message: error.message,
        stack: error.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Gagal mengajukan penawaran',
        error: error.message,
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
      await Lelang.query({ client: trx })
        .where('id', pengajuan.lelangId)
        .update({
          status: 'selesai',
          harga_akhir: pengajuan.hargaPenawaran
        })

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

  /**
   * Riwayat pengajuan lelang user
   */
  public async history({ request, auth, response }: HttpContext) {
    try {
      const limit = request.input('limit', 50)
      const userId = auth.getUserOrFail().id

      // Ambil lelang yang sudah selesai
      const lelangSelesai = await Lelang.query()
        .where('status', 'selesai')
        .select('id')

      const lelangSelesaiIds = lelangSelesai.map(l => l.id)

      // Summary statistic (all time data)
      const totalLelangResult = await PengajuanLelang.query()
        .where('userId', userId)
        .whereIn('lelangId', lelangSelesaiIds)
        .distinctOn(['lelang_id'])
        .count('lelang_id as total')
        .first()

      const totalMenangResult = await PengajuanLelang.query()
        .where('userId', userId)
        .whereIn('lelangId', lelangSelesaiIds)
        .where('isPemenang', 'ya')
        .distinctOn(['lelang_id'])
        .count('lelang_id as total')
        .first()

      const totalLelang = Number(totalLelangResult?.$extras.total || 0)
      const totalMenang = Number(totalMenangResult?.$extras.total || 0)
      const totalKalah = totalLelang - totalMenang

      const summary = {
        total_lelang_diikuti: totalLelang,
        total_menang: totalMenang,
        total_kalah: totalKalah,
      }

      // Ambil last bid user pada setiap lelang selesai
      const pengajuanData = await PengajuanLelang.query()
        .where('userId', userId)
        .whereIn('lelangId', lelangSelesaiIds)
        .preload('lelang', (q) => q.preload('produk'))
        .orderBy('createdAt', 'desc')
        .limit(limit)

      // Group by lelang_id dan ambil yang terakhir
      const groupedBids = pengajuanData.reduce((acc, bid) => {
        if (!acc[bid.lelangId] || acc[bid.lelangId].createdAt < bid.createdAt) {
          acc[bid.lelangId] = bid
        }
        return acc
      }, {} as Record<number, typeof pengajuanData[0]>)

      const lastBids = await Promise.all(
        Object.values(groupedBids).map(async (bid) => {
          // Ambil harga pemenang
          const pemenangBid = await PengajuanLelang.query()
            .where('lelangId', bid.lelangId)
            .where('isPemenang', 'ya')
            .first()

          const hargaPemenang = pemenangBid?.hargaPenawaran ?? bid.lelang.hargaAkhir

          return {
            id: bid.id,
            lelang: bid.lelang,
            harga_penawaran: bid.hargaPenawaran,
            harga_pemenang: hargaPemenang,
            status: bid.isPemenang === 'ya' ? 'Menang' : 'Kalah',
          }
        })
      )

      return response.ok({
        success: true,
        message: 'Riwayat berhasil diambil',
        summary,
        data: lastBids,
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
