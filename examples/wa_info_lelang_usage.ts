/**
 * Contoh penggunaan WaInfoLelang Model dan Factory
 * 
 * File ini berisi contoh-contoh cara menggunakan WaInfoLelang model
 * dan factory untuk berbagai keperluan dalam aplikasi
 */

import WaInfoLelang from '#models/wa_info_lelang'
import { WaInfoLelangFactory } from '#database/factories/wa_info_lelang_factory'
import { DateTime } from 'luxon'

export class WaInfoLelangUsageExamples {
  
  /**
   * Contoh membuat WaInfoLelang baru secara manual
   */
  static async createWaInfoManual() {
    const waInfo = await WaInfoLelang.create({
      lelangId: 1,
      waNumber: '6281234567890',
      waMessage: 'Halo! Lelang telah dimulai untuk produk Anda.',
      waStatus: 'pending',
      infoType: 'auction_start',
      additionalData: {
        start_price: 100000,
        duration: '3 hari'
      }
    })
    
    console.log('Created WaInfoLelang:', waInfo.id)
    return waInfo
  }

  /**
   * Contoh menggunakan factory untuk testing
   */
  static async createWithFactory() {
    // Buat 1 record dengan data random
    const waInfo = await WaInfoLelangFactory.create()
    
    // Buat dengan state tertentu
    const sentWaInfo = await WaInfoLelangFactory.apply('sent').create()
    const failedWaInfo = await WaInfoLelangFactory.apply('failed').create()
    
    // Buat banyak record sekaligus
    const manyWaInfos = await WaInfoLelangFactory.createMany(10)
    
    return { waInfo, sentWaInfo, failedWaInfo, manyWaInfos }
  }

  /**
   * Contoh menggunakan helper methods pada model
   */
  static async useHelperMethods() {
    const waInfo = await WaInfoLelangFactory.create()
    
    // Check status
    console.log('Is pending:', waInfo.isPending())
    console.log('Is sent:', waInfo.isSent())
    console.log('Is failed:', waInfo.isFailed())
    
    // Mark as sent
    waInfo.markAsSent()
    await waInfo.save()
    console.log('Marked as sent at:', waInfo.sentAt?.toISO())
    
    // Mark as failed
    waInfo.markAsFailed('Connection timeout')
    await waInfo.save()
    console.log('Failed with error:', waInfo.errorMessage)
    
    return waInfo
  }

  /**
   * Contoh query dan filtering WaInfoLelang
   */
  static async queryExamples() {
    // Get all pending messages
    const pendingMessages = await WaInfoLelang.query()
      .where('wa_status', 'pending')
      .orderBy('created_at', 'asc')
    
    // Get sent messages in last 24 hours
    const recentSentMessages = await WaInfoLelang.query()
      .where('wa_status', 'sent')
      .where('sent_at', '>=', DateTime.now().minus({ days: 1 }).toSQL())
    
    // Get failed messages for specific lelang
    const failedForLelang = await WaInfoLelang.query()
      .where('lelang_id', 1)
      .where('wa_status', 'failed')
    
    // Get by info type
    const winnerNotifications = await WaInfoLelang.query()
      .where('info_type', 'winner_notification')
    
    return {
      pendingMessages,
      recentSentMessages,
      failedForLelang,
      winnerNotifications
    }
  }

  /**
   * Contoh menggunakan relasi dengan Lelang
   */
  static async relationExamples() {
    // Get WaInfoLelang dengan data lelang
    const waInfoWithLelang = await WaInfoLelang.query()
      .preload('lelang')
      .first()
    
    if (waInfoWithLelang) {
      console.log('WA Info ID:', waInfoWithLelang.id)
      console.log('Lelang ID:', waInfoWithLelang.lelang?.id)
    }
    
    return waInfoWithLelang
  }

  /**
   * Contoh batch operations
   */
  static async batchOperations() {
    // Mark multiple pending messages as failed
    await WaInfoLelang.query()
      .where('wa_status', 'pending')
      .where('created_at', '<', DateTime.now().minus({ hours: 6 }).toSQL())
      .update({
        wa_status: 'failed',
        error_message: 'Timeout - message expired'
      })
    
    // Delete old sent messages (older than 30 days)
    await WaInfoLelang.query()
      .where('wa_status', 'sent')
      .where('sent_at', '<', DateTime.now().minus({ days: 30 }).toSQL())
      .delete()
    
    console.log('Batch operations completed')
  }

  /**
   * Contoh untuk statistics dan reporting
   */
  static async getStatistics() {
    const stats = await WaInfoLelang.query()
      .select('wa_status')
      .count('* as total')
      .groupBy('wa_status')
    
    const infoTypeStats = await WaInfoLelang.query()
      .select('info_type')
      .count('* as total')
      .groupBy('info_type')
    
    const todayCount = await WaInfoLelang.query()
      .where('created_at', '>=', DateTime.now().startOf('day').toSQL())
      .count('* as total')
    
    return {
      statusStats: stats,
      infoTypeStats,
      todayCount: todayCount[0]?.total || 0
    }
  }
}

// Export untuk digunakan di tempat lain
export default WaInfoLelangUsageExamples
