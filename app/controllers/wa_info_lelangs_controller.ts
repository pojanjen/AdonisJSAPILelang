import type { HttpContext } from '@adonisjs/core/http'
import WaInfoLelang from '#models/wa_info_lelang'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export default class WaInfoLelangsController {
  /**
   * Menampilkan semua info WA lelang.
   */
  public async index({ response }: HttpContext) {
    try {
      const waInfos = await WaInfoLelang.query().preload('pembeli', (pembeliQuery) => {
        pembeliQuery.preload('user')
      })

      return response.ok({
        success: true,
        message: 'Data info WA lelang berhasil diambil',
        data: waInfos,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data info WA lelang',
        error: error.message,
      })
    }
  }

  /**
   * Menambah info WA lelang baru.
   */
  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          pembeliId: vine
            .number()
            .exists(async (db, value) => !!(await db.from('pembeli').where('id', value).first())),
          waktuKirimWa: vine.date().transform((value) => DateTime.fromJSDate(value)),
          pesanKirimWa: vine.string().optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      const waInfo = await WaInfoLelang.create({
        pembeliId: payload.pembeliId,
        waktuKirimWa: payload.waktuKirimWa || DateTime.now(),
        pesanKirimWa: payload.pesanKirimWa,
      })

      await waInfo.load('pembeli', (pembeliQuery) => pembeliQuery.preload('user'))

      return response.created({
        success: true,
        message: 'Info WA lelang berhasil ditambahkan',
        data: waInfo,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal menambah info WA lelang',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu info WA lelang.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const waInfo = await WaInfoLelang.findOrFail(params.id)
      await waInfo.load('pembeli', (pembeliQuery) => pembeliQuery.preload('user'))

      return response.ok({
        success: true,
        message: 'Data info WA lelang berhasil diambil',
        data: waInfo,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Info WA lelang tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan info WA lelang berdasarkan ID pembeli.
   */
  public async byPembeli({ params, response }: HttpContext) {
    try {
      const waInfos = await WaInfoLelang.query().where('pembeliId', params.pembeliId)

      return response.ok({
        success: true,
        message: 'Data info WA lelang berhasil diambil',
        data: waInfos,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data info WA lelang',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui info WA lelang.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const waInfo = await WaInfoLelang.findOrFail(params.id)

      const validator = vine.compile(
        vine.object({
          pembeliId: vine
            .number()
            .exists(async (db, value) => !!(await db.from('pembeli').where('id', value).first())),
          waktuKirimWa: vine.date().transform((value) => DateTime.fromJSDate(value)),
          pesanKirimWa: vine.string().optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      waInfo.merge({
        pembeliId: payload.pembeliId,
        waktuKirimWa: payload.waktuKirimWa || waInfo.waktuKirimWa,
        pesanKirimWa: payload.pesanKirimWa,
      })
      await waInfo.save()

      await waInfo.load('pembeli', (pembeliQuery) => pembeliQuery.preload('user'))

      return response.ok({
        success: true,
        message: 'Info WA lelang berhasil diupdate',
        data: waInfo,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate info WA lelang',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus info WA lelang.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const waInfo = await WaInfoLelang.findOrFail(params.id)
      await waInfo.delete()

      return response.ok({
        success: true,
        message: 'Info WA lelang berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus info WA lelang',
        error: error.message,
      })
    }
  }
}

