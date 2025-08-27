import type { HttpContext } from '@adonisjs/core/http'
import Pembeli from '#models/pembeli'
import User from '#models/user'
import PengajuanLelang from '#models/pengajuan_lelang'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'

export default class PembeliController {
  /**
   * Menampilkan semua data pembeli.
   */
  public async index({ response }: HttpContext) {
    try {
      const pembelis = await Pembeli.query().preload('user')
      return response.ok({
        success: true,
        message: 'Data pembeli berhasil diambil',
        data: pembelis,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil data pembeli',
        error: error.message,
      })
    }
  }

  /**
   * Registrasi pembeli baru.
   */
  public async register({ request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const validator = vine.compile(
        vine.object({
          name: vine.string().maxLength(255),
          email: vine
            .string()
            .email()
            .unique(async (db, value) => !(await db.from('users').where('email', value).first())),
          password: vine.string().minLength(8).confirmed(),
          alamatPembeli: vine.string(),
          teleponPembeli: vine.string().maxLength(20),
        })
      )
      const payload = await request.validateUsing(validator)

      const user = await User.create(
        {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: 'pembeli',
        },
        { client: trx }
      )

      const pembeli = await Pembeli.create(
        {
          userId: user.id,
          alamatPembeli: payload.alamatPembeli,
          teleponPembeli: payload.teleponPembeli,
        },
        { client: trx }
      )

      await trx.commit()
      await pembeli.load('user')

      return response.created({
        success: true,
        message: 'Pembeli berhasil didaftarkan',
        data: pembeli,
      })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({
        success: false,
        message: 'Gagal mendaftarkan pembeli',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menampilkan detail satu pembeli.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.findOrFail(params.id)
      await pembeli.load('user')
      return response.ok({
        success: true,
        message: 'Data pembeli berhasil diambil',
        data: pembeli,
      })
    } catch (error) {
      return response.notFound({
        success: false,
        message: 'Pembeli tidak ditemukan',
        error: error.message,
      })
    }
  }

  /**
   * Memperbarui data pembeli.
   */
  public async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const pembeli = await Pembeli.findOrFail(params.id, { client: trx })
      await pembeli.load('user')

      const validator = vine.compile(
        vine.object({
          name: vine.string().maxLength(255),
          alamatPembeli: vine.string(),
          teleponPembeli: vine.string().maxLength(20),
        })
      )
      const payload = await request.validateUsing(validator)

      // Update user
      pembeli.user.name = payload.name
      await pembeli.user.save()

      // Update pembeli
      pembeli.merge({
        alamatPembeli: payload.alamatPembeli,
        teleponPembeli: payload.teleponPembeli,
      })
      await pembeli.save()

      await trx.commit()
      await pembeli.load('user')

      return response.ok({
        success: true,
        message: 'Pembeli berhasil diupdate',
        data: pembeli,
      })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({
        success: false,
        message: 'Gagal mengupdate pembeli',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Menghapus data pembeli dan user terkait.
   */
  public async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const pembeli = await Pembeli.findOrFail(params.id, { client: trx })
      const user = await User.findOrFail(pembeli.userId, { client: trx })

      await pembeli.delete()
      await user.delete()

      await trx.commit()

      return response.ok({
        success: true,
        message: 'Pembeli berhasil dihapus',
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        success: false,
        message: 'Gagal menghapus pembeli',
        error: error.message,
      })
    }
  }

  /**
   * Mengambil riwayat bid seorang pembeli.
   */
  public async riwayatBid({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.findOrFail(params.id)
      const riwayatBid = await PengajuanLelang.query()
        .where('userId', pembeli.userId)
        .preload('lelang', (lelangQuery) => {
          lelangQuery
            .preload('produk', (produkQuery) => produkQuery.preload('jenisProduk'))
            .preload('penerimaanProduk', (penerimaanQuery) => penerimaanQuery.preload('petani'))
        })
        .preload('pembayaranLelang')
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        message: 'Riwayat bid pembeli berhasil diambil',
        data: riwayatBid,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil riwayat bid',
        error: error.message,
      })
    }
  }

  /**
   * Mengambil riwayat kemenangan seorang pembeli.
   */
  public async riwayatKemenangan({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.findOrFail(params.id)
      const riwayatKemenangan = await PengajuanLelang.query()
        .where('userId', pembeli.userId)
        .where('isPemenang', 'ya')
        .preload('lelang', (lelangQuery) => {
          lelangQuery
            .preload('produk', (produkQuery) => produkQuery.preload('jenisProduk'))
            .preload('penerimaanProduk', (penerimaanQuery) => penerimaanQuery.preload('petani'))
        })
        .preload('pembayaranLelang')
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        message: 'Riwayat kemenangan pembeli berhasil diambil',
        data: riwayatKemenangan,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil riwayat kemenangan',
        error: error.message,
      })
    }
  }

  /**
   * Pembeli mengupload KTP untuk verifikasi.
   */
  public async uploadKtp({ request, auth, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          fotoKtp: vine.file({ size: '2mb', extnames: ['jpg', 'png', 'jpeg'] }),
        })
      )
      const payload = await request.validateUsing(validator)
      const user = auth.getUserOrFail()
      await user.load('pembeli')
      const pembeli = user.pembeli

      if (pembeli.statusVerifikasi === 'approved') {
        return response.badRequest({ message: 'Akun sudah terverifikasi.' })
      }

      await payload.fotoKtp.move(app.makePath('public/uploads/ktp'))
      const path = `uploads/ktp/${payload.fotoKtp.fileName}`

      pembeli.merge({
        fotoKtp: path,
        statusVerifikasi: 'pending',
        alasanPenolakan: null,
      })
      await pembeli.save()

      return response.ok({
        message: 'Foto KTP berhasil diupload. Mohon tunggu proses verifikasi oleh admin.',
        data: pembeli,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal upload KTP',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Pembeli mengecek status verifikasinya.
   */
  public async cekStatusVerifikasi({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('pembeli')
    const pembeli = user.pembeli

    return response.ok({
      status_verifikasi: pembeli.statusVerifikasi,
      alasan_penolakan: pembeli.alasanPenolakan,
    })
  }

  // --- Method untuk Admin ---

  /**
   * Admin melihat daftar pengajuan verifikasi.
   */
  public async daftarVerifikasi({ response }: HttpContext) {
    const pengajuan = await Pembeli.query().where('statusVerifikasi', 'pending').preload('user')
    return response.ok(pengajuan)
  }

  /**
   * Admin menyetujui verifikasi.
   */
  public async approveVerifikasi({ params, response }: HttpContext) {
    const pembeli = await Pembeli.findOrFail(params.id)
    pembeli.merge({
      statusVerifikasi: 'approved',
      alasanPenolakan: null,
    })
    await pembeli.save()
    return response.ok({ message: 'Verifikasi pembeli berhasil disetujui.' })
  }

  /**
   * Admin menolak verifikasi.
   */
  public async rejectVerifikasi({ params, request, response }: HttpContext) {
    const validator = vine.compile(vine.object({ alasan: vine.string().maxLength(255) }))
    const { alasan } = await request.validateUsing(validator)

    const pembeli = await Pembeli.findOrFail(params.id)
    pembeli.merge({
      statusVerifikasi: 'rejected',
      alasanPenolakan: alasan,
    })
    await pembeli.save()
    return response.ok({ message: 'Verifikasi pembeli telah ditolak.' })
  }
}
