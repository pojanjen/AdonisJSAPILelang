import Lelang from '#models/lelang'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

export default class CloseAuctionJob {
  public lelangId: number

  /**
   * Create a new job instance.
   */
  constructor(lelangId: number) {
    this.lelangId = lelangId
  }

  /**
   * Execute the job.
   */
  public async handle(): Promise<void> {
    try {
      const lelang = await Lelang.find(this.lelangId)

      if (!lelang) {
        logger.warn(`CloseAuctionJob: Lelang dengan ID ${this.lelangId} tidak ditemukan`)
        return
      }

      logger.info(`CloseAuctionJob: Checking lelang ${this.lelangId}: status=${lelang.status}, end_time=${lelang.tanggalSelesai.toSQL()}, now=${DateTime.now().toSQL()}`)

      // Cek apakah lelang masih dalam status 'dibuka' dan sudah melewati waktu selesai
      if (lelang.status === 'dibuka' && DateTime.now() >= lelang.tanggalSelesai) {
        await lelang.merge({ status: 'ditutup' }).save()
        logger.info(`CloseAuctionJob: SUCCESS - Lelang '${lelang.namaLelang}' (ID: ${lelang.id}) telah ditutup otomatis`)
      } else {
        logger.info(`CloseAuctionJob: SKIP - Lelang ${this.lelangId} tidak perlu ditutup - Status: ${lelang.status}, waktu belum expired atau sudah ditutup`)
      }
    } catch (error) {
      logger.error(`CloseAuctionJob: ERROR for lelang ${this.lelangId}: ${error.message}`)
      throw error // Re-throw untuk failed jobs handling
    }
  }
}
