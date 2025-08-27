import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class GuestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Cek apakah user sudah login
    if (await ctx.auth.check()) {
      // Jika request mengharapkan JSON (API request)
      if (ctx.request.accepts(['html', 'json']) === 'json') {
        return ctx.response.badRequest({
          success: false,
          message: 'Anda sudah login',
        })
      }
      // Jika request web biasa, redirect ke halaman utama
      return ctx.response.redirect('/')
    }

    // Jika belum login, lanjutkan ke request berikutnya
    const output = await next()
    return output
  }
}
