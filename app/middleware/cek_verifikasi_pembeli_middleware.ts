import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CekVerifikasiPembeli {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Mengambil user yang terautentikasi, atau gagal jika tidak ada
      const user = ctx.auth.getUserOrFail()

      // Memuat relasi 'pembeli' dari model User
      // Asumsi relasi ini sudah didefinisikan di model User
      await user.load('pembeli')
      const pembeli = user.pembeli

      // Cek jika profil pembeli tidak ada
      if (!pembeli) {
        return ctx.response.notFound({
          success: false,
          message: 'Profil pembeli tidak ditemukan',
        })
      }

      // Cek jika status verifikasi bukan 'approved'
      // Asumsi nama kolom di model adalah 'statusVerifikasi' (camelCase)
      if (pembeli.statusVerifikasi !== 'approved') {
        return ctx.response.forbidden({
          success: false,
          message: 'Akun Anda belum terverifikasi oleh admin',
          statusVerifikasi: pembeli.statusVerifikasi,
        })
      }

      // Jika semua pengecekan berhasil, lanjutkan ke request berikutnya
      const output = await next()
      return output

    } catch (error) {
      // Menangani error umum, termasuk jika user tidak terautentikasi
      return ctx.response.internalServerError({
        success: false,
        message: 'Terjadi kesalahan sistem atau user tidak terautentikasi',
        error: error.message,
      })
    }
  }
}
