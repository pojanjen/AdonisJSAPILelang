import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Lelang from '#models/lelang'
import { DateTime } from 'luxon'

export default class CloseExpiredAuctions extends BaseCommand {
  static commandName = 'auctions:close-expired'
  static description = 'Set semua lelang berstatus "dibuka" menjadi "ditutup" ketika melewati tanggal_selesai'

  static options: CommandOptions = {}

  async run() {
    try {
      // Query lelang yang expired
      const expiredLelangs = await Lelang.query()
        .where('status', 'dibuka')
        .where('tanggal_selesai', '<=', DateTime.now().toSQL())

      const totalCount = expiredLelangs.length

      this.logger.info(`Found ${totalCount} expired auctions`)

      if (totalCount === 0) {
        this.logger.info('No expired auctions to close')
        return
      }

      // Update lelang yang expired dengan chunking untuk hemat memory
      let updated = 0
      const CHUNK_SIZE = 200

      // Process in chunks
      for (let i = 0; i < expiredLelangs.length; i += CHUNK_SIZE) {
        const chunk = expiredLelangs.slice(i, i + CHUNK_SIZE)

        for (const lelang of chunk) {
          await lelang.merge({ status: 'ditutup' }).save()
          updated++
          this.logger.info(`Closed auction: ${lelang.namaLelang} (ID: ${lelang.id})`)
        }
      }

      this.logger.success(`Expired found: ${totalCount}, updated to 'ditutup': ${updated}`)
    } catch (error) {
      this.logger.error('Error closing expired auctions:', error.message)
      this.exitCode = 1
    }
  }
}
