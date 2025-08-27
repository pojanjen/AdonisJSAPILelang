import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PenerimaanProduk from '#models/penerimaan_produk'
import Lelang from '#models/lelang'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

export default class PenerimaanProdukController {
  /**
   * Menampilkan semua penerimaan produk.
   */
  public async index({ response }: HttpContext) {
    try {
      const penerimaans = await PenerimaanProduk.query()
        .preload('produk', (produkQuery) => produkQuery.preload('jenisProduk'))
        .preload('petani')
        .preload('lelang')

      return response.ok({
        success: true,
        message: 'Data penerimaan produk berhasil diambil',
        data: penerimaans,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data penerimaan produk',
        error: error.message,
      })
    }
  }

  /**
   * Menambah penerimaan produk baru.
   */
  public async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const validator = vine.compile(
        vine.object({
          produkId: vine.number().exists(async (db, v) => !!(await db.from('produks').where('id', v).first())),
          petaniId: vine.number().exists(async (db, v) => !!(await db.from('petanis').where('id', v).first())),
          lelangId: vine.number().exists(async (db, v) => !!(await db.from('lelangs').where('id', v).first())),
          jumlah: vine.number().transform((val) => Math.floor(val)),
          tanggalPenerimaan: vine.date().transform((value) => DateTime.fromJSDate(value)),
          hargaPerUnit: vine.number().min(0),
        })
      )
      const payload = await request.validateUsing(validator)

      // Buat penerimaan produk di dalam transaksi
      const penerimaan = await PenerimaanProduk.create(payload, { client: trx })

      // Update total stock di lelang
      const lelang = await Lelang.findOrFail(payload.lelangId, { client: trx })
      const [{ total }] = await db
      .from('penerimaan_produks')
      .where('lelang_id', payload.lelangId)
      .sum('jumlah as total')
      lelang.totalStock = Number(total ?? 0)
      await lelang.save()

      await trx.commit()

      // Load relasi untuk response
      await penerimaan.load('produk', (q) => q.preload('jenisProduk'))
      await penerimaan.load('petani')
      await penerimaan.load('lelang')

      return response.created({
        success: true,
        message: 'Penerimaan produk berhasil ditambahkan',
        data: penerimaan,
      })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({
        success: false,
        message: 'Gagal menambah penerimaan produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu penerimaan produk.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const penerimaan = await PenerimaanProduk.findOrFail(params.id)
      await penerimaan.load('produk', (q) => q.preload('jenisProduk'))
      await penerimaan.load('petani')
      await penerimaan.load('lelang')

      return response.ok({
        success: true,
        message: 'Data penerimaan produk berhasil diambil',
        data: penerimaan,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Penerimaan produk tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan penerimaan berdasarkan ID lelang.
   */
  public async byLelang({ params, response }: HttpContext) {
    try {
      const penerimaans = await PenerimaanProduk.query()
        .where('lelangId', params.lelangId)
        .preload('produk', (q) => q.preload('jenisProduk'))
        .preload('petani')

      return response.ok({
        success: true,
        message: 'Data penerimaan produk berhasil diambil',
        data: penerimaans,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data penerimaan produk',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui penerimaan produk.
   */
  public async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const penerimaan = await PenerimaanProduk.findOrFail(params.id, { client: trx })

      const validator = vine.compile(
        vine.object({
          produkId: vine.number().exists(async (db, v) => !!(await db.from('produks').where('id', v).first())),
          petaniId: vine.number().exists(async (db, v) => !!(await db.from('petanis').where('id', v).first())),
          lelangId: vine.number().exists(async (db, v) => !!(await db.from('lelangs').where('id', v).first())),
          jumlah: vine.number().transform((val) => Math.floor(val)),
          tanggalPenerimaan: vine.date().transform((value) => DateTime.fromJSDate(value)),
          hargaPerUnit: vine.number().min(0),
        })
      )
      const payload = await request.validateUsing(validator)

      penerimaan.merge(payload)
      await penerimaan.save()

      // Update total stock di lelang
      const lelang = await Lelang.findOrFail(payload.lelangId, { client: trx })
      const [{ total }] = await db
        .from('penerimaan_produks')
        .where('lelang_id', payload.lelangId)
        .sum('jumlah as total')

      lelang.totalStock = Number(total ?? 0)
      await lelang.save()

      await trx.commit()

      await penerimaan.load('produk', (q) => q.preload('jenisProduk'))
      await penerimaan.load('petani')
      await penerimaan.load('lelang')

      return response.ok({
        success: true,
        message: 'Penerimaan produk berhasil diupdate',
        data: penerimaan,
      })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate penerimaan produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus penerimaan produk.
   */
  public async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const penerimaan = await PenerimaanProduk.findOrFail(params.id, { client: trx })
      const lelangId = penerimaan.lelangId

      await penerimaan.delete()

      // Update total stock di lelang setelah penghapusan
      const lelang = await Lelang.findOrFail(lelangId, { client: trx })
      const [{ total }] = await db
        .from('penerimaan_produks')
        .where('lelang_id', lelangId)
        .sum('jumlah as total')

      lelang.totalStock = Number(total ?? 0)
      await lelang.save()

      await trx.commit()

      return response.ok({
        success: true,
        message: 'Penerimaan produk berhasil dihapus',
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus penerimaan produk',
        error: error.message,
      })
    }
  }
}
