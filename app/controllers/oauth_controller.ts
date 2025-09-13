import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Pembeli from '#models/pembeli'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class OAuthController {
  async redirectToGoogle({ ally, logger, response }: HttpContext) {
    try {
      logger.info('OAuth redirect started')
      const googleOauth = ally.use('google')
      return googleOauth.redirect()
    } catch (error) {
      logger.error('OAuth redirect error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to redirect to Google OAuth',
        error: error.message
      })
    }
  }

  async handleGoogleCallback({ ally, response, logger }: HttpContext) {
    let user: User | null = null
    const trx = await db.transaction()

    try {
      logger.info('OAuth callback started')

      const googleOauth = ally.use('google')

      // Check if callback has error
      if (googleOauth.hasError()) {
        const error = googleOauth.getError()
        logger.error('OAuth callback has error:', error)

        return response.status(400).json({
          success: false,
          message: 'OAuth authentication failed',
          error: String(error)
        })
      }

      // Get user info from Google
      const googleUser = await googleOauth.user()
      logger.info('Google user data received:', {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name
      })

      // Check if user already exists by email or googleId
      user = await User.query({ client: trx })
        .where('email', googleUser.email)
        .orWhere('google_id', googleUser.id)
        .first()

      if (user) {
        // Update existing user with Google ID if not set
        if (!user.googleId) {
          user.googleId = googleUser.id
          await user.useTransaction(trx).save()
        }
        logger.info('Existing user logged in via OAuth:', { userId: user.id })
      } else {
        // Create new user
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.id,
          role: 'pembeli',
          password: 'oauth-user', // Placeholder password for OAuth users
          emailVerifiedAt: DateTime.now() // Mark as verified since Google verified it
        }, { client: trx })

        // Create pembeli profile for new user
        await Pembeli.create({
          userId: user.id,
          alamatPembeli: '', // Will be filled later by user
          teleponPembeli: '', // Will be filled later by user
          statusVerifikasi: 'pending'
        }, { client: trx })

        logger.info('New user created via OAuth:', { userId: user.id })
      }

      // Commit transaction first
      await trx.commit()
      logger.info('User transaction committed successfully')

      // Generate access token outside of transaction to avoid locks
      logger.info('Attempting to generate access token for user:', { userId: user.id })
      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '7 days',
      })
      logger.info('Access token generated successfully:', { tokenExists: !!token })

      logger.info('OAuth authentication successful:', { userId: user.id })

      return response.json({
        success: true,
        message: 'Authentication successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            google_id: user.googleId
          },
          token: {
            type: 'Bearer',
            token: token.value!.release(),
            expires_at: token.expiresAt
          }
        }
      })

    } catch (error) {
      // Only rollback if transaction is still active
      if (!trx.isCompleted) {
        await trx.rollback()
      }

      logger.error('OAuth callback error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      })

      return response.status(500).json({
        success: false,
        message: 'Internal server error during OAuth authentication',
        error: error.message,
        details: {
          name: error.name,
          code: error.code
        }
      })
    }
  }

  async getOAuthUser({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      await user.load('pembeli')

      return response.json({
        success: true,
        message: 'OAuth user data retrieved',
        data: user
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to get OAuth user data',
        error: error.message
      })
    }
  }
}
