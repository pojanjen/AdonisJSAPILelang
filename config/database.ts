import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        typeCast(field:any, next:any) {
          // kalau kolom bertipe JSON, kembalikan string mentah
          if (field.type === 'JSON') {
            return field.string("utf8")
          }
          return next()
        },
      } as any,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      pool: {
        min: Number(env.get('DB_POOL_MIN', '2')),
        max: Number(env.get('DB_POOL_MAX', '1000')),
        // opsi tambahan untuk stabilitas
        acquireTimeoutMillis: Number(env.get('DB_POOL_ACQUIRE_MS', '60000')),
        createTimeoutMillis: Number(env.get('DB_POOL_CREATE_MS', '30000')),
        idleTimeoutMillis: Number(env.get('DB_POOL_IDLE_MS', '30000')),
      },
    },
  },
})

export default dbConfig
