import type { HttpContext } from '@adonisjs/core/http'
import PembayaranLelang from '#models/pembayaran_lelang'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

export default class PembayaranLelangsController {
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
}
