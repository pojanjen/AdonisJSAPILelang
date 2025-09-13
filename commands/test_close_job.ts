import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import CloseAuctionJob from '../app/jobs/close_auction_job.js'
import app from '@adonisjs/core/services/app'

export default class TestCloseJob extends BaseCommand {
  static commandName = 'test:close-job'
  static description = 'Test close auction job manually'

  static options: CommandOptions = {}

  @args.string({ description: 'Lelang ID to test' })
  declare lelangId: string

  async run() {
    try {
      await app.container.make('lucid.db')

      const id = parseInt(this.lelangId)
      if (isNaN(id)) {
        this.logger.error('Invalid lelang ID')
        return
      }

      this.logger.info(`Testing CloseAuctionJob for lelang ID: ${id}`)

      const job = new CloseAuctionJob(id)
      await job.handle()
      this.logger.success('Job completed successfully')
    } catch (error) {
      this.logger.error('Job failed:', error.message)
      this.logger.error('Stack trace:', error.stack)
    }
  }
}
