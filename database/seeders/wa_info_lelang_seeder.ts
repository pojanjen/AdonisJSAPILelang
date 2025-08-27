import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { WaInfoLelangFactory } from '#database/factories/wa_info_lelang_factory'

export default class extends BaseSeeder {
  async run() {
    // Buat 20 record random WaInfoLelang
    await WaInfoLelangFactory.createMany(20)

    // Buat beberapa record dengan state tertentu
    await WaInfoLelangFactory.with('sent').createMany(5)
    await WaInfoLelangFactory.with('failed').createMany(3)
    await WaInfoLelangFactory.with('auctionStart').createMany(2)
    await WaInfoLelangFactory.with('winnerNotification').createMany(2)

    console.log('✅ WaInfoLelang seeder completed')
  }
}
