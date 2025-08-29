import type { HttpContext } from '@adonisjs/core/http'
import PembayaranLelang from '#models/pembayaran_lelang'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

export default class PembayaranLelangsController {
  /**
   * Menampilkan semua data pembayaran dengan relasi.
   */
  public async index({ response }: HttpContext) {
    try {
      const pembayaranList = await PembayaranLelang.query()
        .preload('pengajuanLelang', (pengajuanQuery) => {
          pengajuanQuery
            .preload('lelang', (lelangQuery) => lelangQuery.preload('produk'))
            .preload('user')
        })
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        message: 'Data pembayaran berhasil diambil',
        data: pembayaranList,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data pembayaran',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan detail pembayaran berdasarkan ID.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const pembayaran = await PembayaranLelang.query()
        .where('id', params.id)
        .preload('pengajuanLelang', (pengajuanQuery) => {
          pengajuanQuery
            .preload('lelang', (lelangQuery) => lelangQuery.preload('produk'))
            .preload('user')
        })
        .firstOrFail()

      return response.ok({
        success: true,
        message: 'Detail pembayaran berhasil diambil',
        data: pembayaran,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Pembayaran tidak ditemukan',
        error: error.message,
      })
    }
  }

  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          pengajuanLelangId: vine
            .number()
            .exists(async (db, value) =>
              !!(await db.from('pengajuan_lelangs').where('id', value).first())
            ),
          jumlahPembayaran: vine.number().min(0),

          // langsung transform -> DateTime Luxon
          tanggalPembayaran: vine
            .date()
            .transform((val) => DateTime.fromJSDate(val)),

          buktiPembayaran: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png', 'gif'],
          }),
        })
      )

      const payload = await request.validateUsing(validator)

      // Upload bukti pembayaran
      await payload.buktiPembayaran.move(app.makePath('public/uploads/pembayaran'))
      const buktiPath = `uploads/pembayaran/${payload.buktiPembayaran.fileName}`

      // Create langsung, payload sudah cocok dengan model
      const pembayaran = await PembayaranLelang.create({
        pengajuanLelangId: payload.pengajuanLelangId,
        jumlahPembayaran: payload.jumlahPembayaran,
        tanggalPembayaran: payload.tanggalPembayaran, // sudah DateTime Luxon
        buktiPembayaran: buktiPath,
        statusPembayaran: 'pending',
      })

      // Load relasi untuk response
      await pembayaran.load('pengajuanLelang', (pengajuanQuery) => {
        pengajuanQuery
          .preload('lelang', (lelangQuery) => lelangQuery.preload('produk'))
          .preload('user')
      })

      return response.created({
        success: true,
        message: 'Pembayaran berhasil ditambahkan',
        data: pembayaran,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal menambah pembayaran',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Update status pembayaran (untuk admin).
   */
  public async updateStatus({ params, request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          statusPembayaran: vine
            .string()
            .in(['pending', 'lunas', 'belum_lunas', 'ditolak'])
        })
      )

      const payload = await request.validateUsing(validator)
      const pembayaran = await PembayaranLelang.findOrFail(params.id)

      pembayaran.statusPembayaran = payload.statusPembayaran as 'pending' | 'lunas' | 'belum_lunas' | 'ditolak'
      await pembayaran.save()

      // Load relasi untuk response
      await pembayaran.load('pengajuanLelang', (pengajuanQuery) => {
        pengajuanQuery
          .preload('lelang', (lelangQuery) => lelangQuery.preload('produk'))
          .preload('user')
      })

      return response.ok({
        success: true,
        message: 'Status pembayaran berhasil diupdate',
        data: pembayaran,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate status pembayaran',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus data pembayaran.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const pembayaran = await PembayaranLelang.findOrFail(params.id)

      // Hapus file bukti pembayaran jika ada
      if (pembayaran.buktiPembayaran) {
        try {
          await fs.unlink(app.makePath('public', pembayaran.buktiPembayaran))
        } catch (fileError) {
          // File mungkin sudah tidak ada, lanjutkan hapus record
          console.warn('File bukti pembayaran tidak ditemukan:', fileError.message)
        }
      }

      await pembayaran.delete()

      return response.ok({
        success: true,
        message: 'Pembayaran berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus pembayaran',
        error: error.message,
      })
    }
  }
}
