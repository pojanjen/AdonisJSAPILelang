import type { HttpContext } from '@adonisjs/core/http'
import Produk from '#models/produk'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'

export default class ProduksController {
  /**
   * Menampilkan semua data produk.
   */
  public async index({ response }: HttpContext) {
    try {
      const produks = await Produk.all()
      return response.ok({
        success: true,
        message: 'Data produk berhasil diambil',
        data: produks,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data produk',
        error: error.message,
      })
    }
  }

  /**
   * Menambah produk baru.
   */
  public async store({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          namaProduk: vine.string().maxLength(255),
          fotoProduk: vine.file({ size: '2mb', extnames: ['jpg', 'png', 'jpeg', 'gif'] }).optional(),
          jenisProdukId: vine
            .number()
            .exists(async (db, v) => !!(await db.from('jenis_produks').where('id', v).first())),
          deskripsiProduk: vine.string(),
          stock: vine.number().min(0),
        })
      )
      const payload = await request.validateUsing(validator)

      let fotoPath: string | null = null
      if (payload.fotoProduk) {
        await payload.fotoProduk.move(app.makePath('public/uploads/produk'))
        fotoPath = `uploads/produk/${payload.fotoProduk.fileName}`
      }

      const produk = await Produk.create({
        namaProduk: payload.namaProduk,
        fotoProduk: fotoPath,
        jenisProdukId: payload.jenisProdukId,
        deskripsiProduk: payload.deskripsiProduk,
        stock: payload.stock,
      })

      await produk.load('jenisProduk')

      return response.created({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: produk,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal menambah produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu produk.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const produk = await Produk.findOrFail(params.id)
      await produk.load('jenisProduk')
      await produk.load('lelang')
      await produk.load('penerimaanProduk', (q) => q.preload('petani'))
      await produk.load('fotoProdukLelang')

      return response.ok({
        success: true,
        message: 'Data produk berhasil diambil',
        data: produk,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Produk tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui data produk.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const produk = await Produk.findOrFail(params.id)

      const validator = vine.compile(
        vine.object({
          namaProduk: vine.string().maxLength(255),
          fotoProduk: vine.file({ size: '2mb', extnames: ['jpg', 'png', 'jpeg', 'gif'] }).optional(),
          jenisProdukId: vine
            .number()
            .exists(async (db, v) => !!(await db.from('jenis_produks').where('id', v).first())),
          deskripsiProduk: vine.string(),
          stock: vine.number().min(0),
        })
      )
      const payload = await request.validateUsing(validator)

      let fotoPath = produk.fotoProduk
      if (payload.fotoProduk) {
        if (produk.fotoProduk) {
          await fs.unlink(app.makePath(`public/${produk.fotoProduk}`))
        }
        await payload.fotoProduk.move(app.makePath('public/uploads/produk'))
        fotoPath = `uploads/produk/${payload.fotoProduk.fileName}`
      }

      produk.merge({
        namaProduk: payload.namaProduk,
        fotoProduk: fotoPath,
        jenisProdukId: payload.jenisProdukId,
        deskripsiProduk: payload.deskripsiProduk,
        stock: payload.stock,
      })
      await produk.save()

      await produk.load('jenisProduk')

      return response.ok({
        success: true,
        message: 'Produk berhasil diupdate',
        data: produk,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate produk',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus data produk.
   */
  public async destroy({ params, response }: HttpContext) {
    try {
      const produk = await Produk.findOrFail(params.id)

      if (produk.fotoProduk) {
        await fs.unlink(app.makePath(`public/${produk.fotoProduk}`))
      }

      await produk.delete()

      return response.ok({
        success: true,
        message: 'Produk berhasil dihapus',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus produk',
        error: error.message,
      })
    }
  }
}

