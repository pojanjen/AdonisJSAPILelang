import Lelang from '#models/lelang'
import JobScheduler from '../jobs/job_scheduler.js'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

export default class AuctionSchedulingService {
  /**
   * Initialize all pending auction close jobs on application startup
   */
  public static async initializeScheduledJobs(): Promise<void> {
    try {
      logger.info('Initializing auction scheduling service...')

      // Get all active auctions that should be scheduled
      const activeAuctions = await Lelang.query()
        .where('status', 'dibuka')
        .where('tanggal_selesai', '>', DateTime.now().toSQL())

      logger.info(`Found ${activeAuctions.length} active auctions to schedule`)

      // Schedule close jobs for each active auction
      for (const auction of activeAuctions) {
        auction.scheduleCloseJob()
      }

      logger.info(`Scheduled ${activeAuctions.length} auction close jobs`)
    } catch (error) {
      logger.error('Failed to initialize auction scheduling service:', error.message)
    }
  }

  /**
   * Get scheduled jobs info for monitoring
   */
  public static getSchedulingInfo(): { 
    scheduledCount: number; 
    scheduledAuctions: number[] 
  } {
    return {
      scheduledCount: JobScheduler.getScheduledJobsCount(),
      scheduledAuctions: JobScheduler.getScheduledLelangIds(),
    }
  }

  /**
   * Cleanup all scheduled jobs (useful for graceful shutdown)
   */
  public static cleanup(): void {
    logger.info('Cleaning up auction scheduling service...')
    JobScheduler.clearAllJobs()
    logger.info('Auction scheduling service cleanup completed')
  }
}
