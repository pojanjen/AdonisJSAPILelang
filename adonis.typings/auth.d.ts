import AccessToken from '@adonisjs/auth/access_tokens'
import User from '#models/user'

declare module '@adonisjs/auth/access_tokens' {
  interface AccessTokensModel {
    user: typeof User
  }
}

declare module '@adonisjs/auth/types' {
  interface Guards {
    api: {
      implementation: 'access_tokens'
      options: {
        model: typeof User
        tokens: 'accessTokens'
      }
    }
  }
}
