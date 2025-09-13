import CloseAuctionJob from './close_auction_job.js'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

export default class JobScheduler {
  private static scheduledJobs: Map<number, NodeJS.Timeout> = new Map()

  /**
   * Schedule a job to close auction at specific time
   */
  public static scheduleCloseAuction(lelangId: number, endTime: DateTime): void {
    // Clear existing job for this lelang if any
    this.cancelScheduledJob(lelangId)

    const now = DateTime.now()
    const delay = endTime.diff(now, 'milliseconds').milliseconds

    if (delay <= 0) {
      // If already expired, run immediately
      logger.info(`Lelang ${lelangId} already expired, closing immediately`)
      this.runCloseAuctionJob(lelangId)
      return
    }

    logger.info(`Scheduling close job for lelang ${lelangId} to run at ${endTime.toSQL()} (delay: ${Math.round(delay / 1000)}s)`)

    // Schedule the job
    const timeoutId = setTimeout(async () => {
      await this.runCloseAuctionJob(lelangId)
      this.scheduledJobs.delete(lelangId)
    }, delay)

    // Store timeout ID for potential cancellation
    this.scheduledJobs.set(lelangId, timeoutId)
  }

  /**
   * Cancel a scheduled job for specific lelang
   */
  public static cancelScheduledJob(lelangId: number): void {
    const timeoutId = this.scheduledJobs.get(lelangId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledJobs.delete(lelangId)
      logger.info(`Cancelled scheduled job for lelang ${lelangId}`)
    }
  }

  /**
   * Run the close auction job
   */
  private static async runCloseAuctionJob(lelangId: number): Promise<void> {
    try {
      const job = new CloseAuctionJob(lelangId)
      await job.handle()
    } catch (error) {
      logger.error(`Failed to execute close auction job for lelang ${lelangId}:`, error.message)
    }
  }

  /**
   * Get count of currently scheduled jobs
   */
  public static getScheduledJobsCount(): number {
    return this.scheduledJobs.size
  }

  /**
   * Get all scheduled lelang IDs
   */
  public static getScheduledLelangIds(): number[] {
    return Array.from(this.scheduledJobs.keys())
  }

  /**
   * Clear all scheduled jobs (useful for testing or shutdown)
   */
  public static clearAllJobs(): void {
    for (const timeoutId of this.scheduledJobs.values()) {
      clearTimeout(timeoutId)
    }
    this.scheduledJobs.clear()
    logger.info('Cleared all scheduled jobs')
  }
}
