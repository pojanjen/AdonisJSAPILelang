import type { HttpContext } from '@adonisjs/core/http'
import Pembeli from '#models/pembeli'
import User from '#models/user'
import PengajuanLelang from '#models/pengajuan_lelang'
import Lelang from '#models/lelang'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'

export default class PembeliController {
  /**
   * Ambil semua pembeli.
   */
  public async index({ response }: HttpContext) {
    try {
      const pembeli = await Pembeli.query().preload('user')

      return response.ok({
        success: true,
        message: 'Data pembeli berhasil diambil',
        data: pembeli,
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
      // Validasi input
      const validator = vine.compile(
        vine.object({
          name: vine.string().maxLength(255),
          email: vine
            .string()
            .email()
            .maxLength(255)
            .unique(async (db, value) => !(await db.from('users').where('email', value).first())),
          password: vine.string().minLength(8).confirmed(),
          alamat_pembeli: vine.string(),
          telepon_pembeli: vine.string().maxLength(20),
          nomor_rekening: vine.string().maxLength(50).optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      // Buat user baru
      const user = await User.create(
        {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: 'pembeli',
        },
        { client: trx }
      )

      // Buat pembeli baru
      const pembeli = await Pembeli.create(
        {
          userId: user.id,
          alamatPembeli: payload.alamat_pembeli,
          teleponPembeli: payload.telepon_pembeli,
          nomorRekening: payload.nomor_rekening,
        },
        { client: trx }
      )

      await trx.commit()

      // Load relasi untuk response
      await pembeli.load('user')

      return response.created({
        success: true,
        message: 'Pembeli berhasil didaftarkan',
        data: pembeli,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        success: false,
        message: 'Gagal mendaftarkan pembeli',
        error: error.message,
      })
    }
  }

  /**
   * Ambil pembeli berdasarkan ID.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.query()
        .where('id', params.id)
        .preload('user')
        .first()

      if (!pembeli) {
        return response.notFound({
          success: false,
          message: 'Pembeli tidak ditemukan',
        })
      }

      return response.ok({
        success: true,
        message: 'Data pembeli berhasil diambil',
        data: pembeli,
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
   * Update pembeli.
   */
  public async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const pembeli = await Pembeli.query({ client: trx })
        .where('id', params.id)
        .preload('user')
        .first()

      if (!pembeli) {
        await trx.rollback()
        return response.notFound({
          success: false,
          message: 'Pembeli tidak ditemukan',
        })
      }

      // Validasi input
      const validator = vine.compile(
        vine.object({
          name: vine.string().maxLength(255),
          alamat_pembeli: vine.string(),
          telepon_pembeli: vine.string().maxLength(20),
          nomor_rekening: vine.string().maxLength(50).optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      // Update user
      await pembeli.user.merge({ name: payload.name }).save()

      // Update pembeli
      await pembeli.merge({
        alamatPembeli: payload.alamat_pembeli,
        teleponPembeli: payload.telepon_pembeli,
        nomorRekening: payload.nomor_rekening,
      }).save()

      await trx.commit()

      // Load relasi untuk response
      await pembeli.load('user')

      return response.ok({
        success: true,
        message: 'Pembeli berhasil diupdate',
        data: pembeli,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        success: false,
        message: 'Gagal mengupdate pembeli',
        error: error.message,
      })
    }
  }

  /**
   * Hapus pembeli.
   */
  public async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const pembeli = await Pembeli.query({ client: trx })
        .where('id', params.id)
        .preload('user')
        .first()

      if (!pembeli) {
        await trx.rollback()
        return response.notFound({
          success: false,
          message: 'Pembeli tidak ditemukan',
        })
      }

      // Simpan ID user untuk dihapus
      const userId = pembeli.userId

      // Hapus pembeli
      await pembeli.delete()

      // Hapus user terkait
      await User.query({ client: trx }).where('id', userId).delete()

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
   * Riwayat bid pembeli berdasarkan user_id pembeli.
   */
  public async riwayatBid({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.find(params.id)

      if (!pembeli) {
        return response.notFound({
          success: false,
          message: 'Pembeli tidak ditemukan',
        })
      }

      // Ambil lelang yang sudah selesai
      const lelangSelesai = await Lelang.query()
        .where('status', 'ditutup')
        .orWhere('tanggalSelesai', '<', DateTime.now().toSQL())
        .select('id')

      const lelangIds = lelangSelesai.map(lelang => lelang.id)

      // Ambil bid terakhir dari setiap lelang yang sudah selesai
      const lastBids = await PengajuanLelang.query()
        .preload('lelang')
        .where('userId', pembeli.userId)
        .whereIn('lelangId', lelangIds)
        .orderBy('createdAt', 'desc')

      // Group by lelang_id dan ambil yang pertama (terbaru) dari setiap group
      const groupedBids = new Map()
      lastBids.forEach(bid => {
        if (!groupedBids.has(bid.lelangId)) {
          groupedBids.set(bid.lelangId, bid)
        }
      })

      const lastBid = Array.from(groupedBids.values())

      return response.ok({
        success: true,
        message: 'Riwayat bid pembeli berhasil diambil',
        data: lastBid,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil riwayat Bid',
        error: error.message,
      })
    }
  }

  /**
   * Riwayat kemenangan pembeli berdasarkan user_id pembeli.
   */
  public async riwayatKemenangan({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.find(params.id)

      if (!pembeli) {
        return response.notFound({
          success: false,
          message: 'Pembeli tidak ditemukan',
        })
      }

      // Ambil pengajuan lelang yang dimenangkan berdasarkan user_id pembeli
      const riwayatKemenangan = await PengajuanLelang.query()
        .preload('lelang', (lelangQuery) => {
          lelangQuery
            .preload('produk', (produkQuery) => {
              produkQuery.preload('jenisProduk')
            })
            .preload('penerimaanProduk', (penerimaanQuery) => {
              penerimaanQuery.preload('petani')
            })
        })
        .preload('pembayaranLelang')
        .where('userId', pembeli.userId)
        .where('isPemenang', 'ya')
        .orderBy('createdAt', 'desc')

      return response.ok({
        success: true,
        message: 'Riwayat kemenangan pembeli berhasil diambil',
        data: riwayatKemenangan,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil riwayat kemenangan pembeli',
        error: error.message,
      })
    }
  }

  /**
   * Untuk pembeli mengupload foto KTP.
   */
  public async uploadKtp({ request, auth, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          foto_ktp: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png'],
          }),
        })
      )
      const payload = await request.validateUsing(validator)

      const user = auth.user!
      await user.load('pembeli')

      // Hapus foto KTP lama jika ada
      if (user.pembeli && user.pembeli.fotoKtp) {
        const oldFilePath = app.makePath('public/uploads', user.pembeli.fotoKtp.replace('public/', ''))
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
        }
      }

      // Upload foto KTP baru
      const fileName = `${user.id}_${Date.now()}.${payload.foto_ktp.extname}`
      await payload.foto_ktp.move(app.makePath('public/uploads/ktp'), {
        name: fileName,
      })

      const path = `ktp/${fileName}`

      // Update atau create pembeli
      if (user.pembeli) {
        user.pembeli.fotoKtp = `public/uploads/${path}`
        await user.pembeli.save()
      } else {
        await Pembeli.create({
          userId: user.id,
          fotoKtp: `public/uploads/${path}`,
        })
      }

      return response.ok({
        success: true,
        message: 'Foto KTP berhasil diupload',
        data: {
          foto_ktp: path,
          foto_ktp_url: `asset('storage/' . ${path})`, // URL lengkap
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal upload foto KTP',
        error: error.message,
      })
    }
  }

  /**
   * Untuk pembeli mengecek status verifikasinya sendiri.
   */
  public async cekStatusVerifikasi({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      await user.load('pembeli')

      if (!user.pembeli) {
        return response.notFound({
          success: false,
          message: 'Data pembeli tidak ditemukan',
        })
      }

      return response.ok({
        status_verifikasi: user.pembeli.statusVerifikasi,
        alasan_penolakan: user.pembeli.alasanPenolakan,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengecek status verifikasi',
        error: error.message,
      })
    }
  }

  /**
   * Update profile pembeli.
   */
  public async updateProfile({ request, auth, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const user = auth.user!
      await user.load('pembeli')

      if (!user.pembeli) {
        await trx.rollback()
        return response.notFound({
          success: false,
          message: 'Data pembeli tidak ditemukan',
        })
      }

      // DEBUG: lihat persis apa yang sampai ke server
      logger.info('Update Profile Request', {
        user_id: user.id,
        request_all: request.all(), // <-- penting
      })

      // Validasi
      const validator = vine.compile(
        vine.object({
          name: vine.string().maxLength(255).optional(),
          alamat_pembeli: vine.string().optional(),
          telepon_pembeli: vine.string().maxLength(20).optional(),
          foto_ktp: vine.file({
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png'],
          }).optional(),
        })
      )
      const payload = await request.validateUsing(validator)

      // Update name (user)
      if (payload.name) {
        user.name = payload.name
        await user.save()
      }

      const pembeli = user.pembeli

      // Update pembeli - SET ATRIBUT SATU PER SATU (tanpa mass assignment)
      if (payload.alamat_pembeli) {
        pembeli.alamatPembeli = payload.alamat_pembeli
      }
      if (payload.telepon_pembeli) {
        pembeli.teleponPembeli = payload.telepon_pembeli
      }

      // Foto KTP
      if (payload.foto_ktp) {
        if (pembeli.statusVerifikasi === 'approved') {
          await trx.rollback()
          return response.badRequest({
            success: false,
            message: 'Foto KTP tidak dapat diubah karena akun sudah terverifikasi',
          })
        }

        // Hapus foto lama
        if (pembeli.fotoKtp) {
          const oldFilePath = app.makePath('public/uploads', pembeli.fotoKtp.replace('public/', ''))
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath)
          }
        }

        // Upload foto baru
        const fileName = `${user.id}_${Date.now()}.${payload.foto_ktp.extname}`
        await payload.foto_ktp.move(app.makePath('public/uploads/ktp'), {
          name: fileName,
        })

        const path = `ktp/${fileName}`
        pembeli.fotoKtp = `public/uploads/${path}`

        const hadPreviousKtp = pembeli.fotoKtp !== null
        if (pembeli.statusVerifikasi === 'rejected' || !hadPreviousKtp) {
          pembeli.statusVerifikasi = 'pending'
          pembeli.alasanPenolakan = null
        }
      }

      await pembeli.save()
      await trx.commit()

      await user.refresh()
      await user.load('pembeli')

      logger.info('Final updated data', {
        user_name: user.name,
        pembeli_address: user.pembeli.alamatPembeli,
        pembeli_phone: user.pembeli.teleponPembeli,
      })

      return response.ok({
        success: true,
        message: 'Profile berhasil diupdate',
        data: user,
      })
    } catch (error) {
      await trx.rollback()
      logger.error('Update Profile Error', {
        message: error.message,
        trace: error.stack,
      })
      return response.internalServerError({
        success: false,
        message: 'Gagal mengupdate profile',
        error: error.message,
      })
    }
  }

  // --- Method untuk Admin ---

  /**
   * Admin melihat daftar pengajuan verifikasi.
   */
  public async daftarVerifikasi({ response }: HttpContext) {
    try {
      // Ambil pembeli yang statusnya masih 'pending'
      const pengajuan = await Pembeli.query()
        .where('statusVerifikasi', 'pending')
        .preload('user')

      return response.ok(pengajuan)
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil daftar verifikasi',
        error: error.message,
      })
    }
  }

  /**
   * Admin menyetujui verifikasi.
   */
  public async approveVerifikasi({ params, response }: HttpContext) {
    try {
      const pembeli = await Pembeli.findOrFail(params.id)
      pembeli.statusVerifikasi = 'approved'
      pembeli.alasanPenolakan = null
      await pembeli.save()

      // Opsional: Kirim notifikasi ke pembeli

      return response.ok({
        message: 'Verifikasi pembeli berhasil disetujui.',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menyetujui verifikasi',
        error: error.message,
      })
    }
  }

  /**
   * Admin menolak verifikasi.
   */
  public async rejectVerifikasi({ params, request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          alasan: vine.string().maxLength(255),
        })
      )
      const payload = await request.validateUsing(validator)

      const pembeli = await Pembeli.findOrFail(params.id)
      pembeli.statusVerifikasi = 'rejected'
      pembeli.alasanPenolakan = payload.alasan
      await pembeli.save()

      // Opsional: Kirim notifikasi ke pembeli

      return response.ok({
        message: 'Verifikasi pembeli telah ditolak.',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal menolak verifikasi',
        error: error.message,
      })
    }
  }
}
