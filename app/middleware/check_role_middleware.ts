import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  /**
   * Handle request
   */
  async handle(ctx: HttpContext, next: NextFn, options: { roles: string[] }) {
    // Middleware 'auth' biasanya sudah dijalankan sebelum ini,
    // jadi kita bisa langsung mengambil data user.
    const user = ctx.auth.user

    // Cek jika user tidak ada atau role-nya tidak termasuk dalam
    // daftar role yang diizinkan (yang dikirim dari file route).
    // Asumsi: model User Anda memiliki properti 'role'.
    if (!user || !options.roles.includes(user.role)) {
      return ctx.response.forbidden({
        success: false,
        message: 'Forbidden: Anda tidak memiliki akses',
      })
    }

    // Jika role sesuai, lanjutkan ke request berikutnya.
    const output = await next()
    return output
  }
}
