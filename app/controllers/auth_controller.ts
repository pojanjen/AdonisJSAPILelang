import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Pembeli from '#models/pembeli'
import hash from '@adonisjs/core/services/hash'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

export default class AuthController {
  /**
   * Registrasi user pembeli baru.
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
            .maxLength(255)
            .unique(async (db, value) => !(await db.from('users').where('email', value).first())),
          password: vine.string().minLength(8).confirmed(),
          alamatPembeli: vine.string(),
          teleponPembeli: vine.string().maxLength(20),
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
          alamatPembeli: payload.alamatPembeli,
          teleponPembeli: payload.teleponPembeli,
        },
        { client: trx }
      )

      await trx.commit()

      // Generate token langsung
      const token = await User.accessTokens.create(user)

      return response.created({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          user,
          pembeli,
          accessToken: token.value!.release(),
          tokenType: 'Bearer',
          expiresAt: token.expiresAt,
        },
      })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({
        success: false,
        message: 'Registrasi gagal',
        error: error.messages || error.message,
      })
    }
  }

  /**
   * Login user.
   */
  public async login({ request, response }: HttpContext) {
    try {
      const validator = vine.compile(
        vine.object({
          email: vine.string().email(),
          password: vine.string(),
        })
      )
      const { email, password } = await request.validateUsing(validator)

      // Cek kredensial
      const user = await User.verifyCredentials(email, password)

      if (user.role === 'pembeli') {
        await user.load('pembeli')
      }

      // Generate token
      const token = await User.accessTokens.create(user)

      return response.ok({
        success: true,
        message: 'Login berhasil',
        data: {
          user,
          accessToken: token.value!.release(),
          tokenType: 'Bearer',
          expiresAt: token.expiresAt,
        },
      })
    } catch (error) {
      return response.unauthorized({
        success: false,
        message: 'Email atau password salah',
        error: error.message,
      })
    }
  }

  /**
   * Profile
   */
  public async profile({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()

      if (user.role === 'pembeli') {
        await user.load('pembeli')
      }

      return response.ok({
        success: true,
        message: 'Profile berhasil diambil',
        data: user,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Gagal mengambil profile',
        error: error.message,
      })
    }
  }

  /**
   * Logout
   */
  public async logout({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)

      return response.ok({
        success: true,
        message: 'Logout berhasil',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Logout gagal',
        error: error.message,
      })
    }
  }

  /**
   * Update password
   */
  public async updatePassword({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()

      const validator = vine.compile(
        vine.object({
          currentPassword: vine.string(),
          password: vine.string().minLength(8).confirmed(),
        })
      )
      const payload = await request.validateUsing(validator)

      if (!(await hash.verify(user.password, payload.currentPassword))) {
        return response.unauthorized({
          success: false,
          message: 'Password lama salah',
        })
      }

      user.password = payload.password
      await user.save()

      return response.ok({
        success: true,
        message: 'Password berhasil diupdate',
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Update password gagal',
        error: error.messages || error.message,
      })
    }
  }
}
