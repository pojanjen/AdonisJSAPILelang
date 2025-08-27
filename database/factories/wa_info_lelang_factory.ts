import factory from '@adonisjs/lucid/factories'
import WaInfoLelang from '#models/wa_info_lelang'
import { DateTime } from 'luxon'

type WaStatus = 'pending' | 'sent' | 'failed'
type InfoType = 'auction_start' | 'winner_notification' | 'payment_reminder' | 'auction_end'

export const WaInfoLelangFactory = factory
  .define(WaInfoLelang, async ({ faker }) => {
    const statuses: WaStatus[] = ['pending', 'sent', 'failed']
    const infoTypes: InfoType[] = ['auction_start', 'winner_notification', 'payment_reminder', 'auction_end']
    const selectedStatus = faker.helpers.arrayElement(statuses)
    const selectedInfoType = faker.helpers.arrayElement(infoTypes)
    
    // Generate Indonesian phone number format
    const waNumber = '62' + faker.string.numeric(9) // 62xxxxxxxxx format
    
    // Generate WhatsApp message based on info type
    const generateMessage = (type: InfoType): string => {
      switch (type) {
        case 'auction_start':
          return `Halo! Lelang telah dimulai. Jangan lewatkan kesempatan untuk berpartisipasi!`
        case 'winner_notification':
          return `Selamat! Anda telah memenangkan lelang. Silakan lakukan pembayaran sesuai instruksi.`
        case 'payment_reminder':
          return `Reminder: Mohon segera lakukan pembayaran untuk lelang yang telah Anda menangkan.`
        case 'auction_end':
          return `Pemberitahuan: Lelang telah berakhir. Terima kasih atas partisipasi Anda.`
        default:
          return faker.lorem.sentence()
      }
    }
    
    // Generate additional data based on info type
    const generateAdditionalData = (type: InfoType) => {
      switch (type) {
        case 'winner_notification':
          return {
            winner_bid: faker.number.int({ min: 100000, max: 10000000 }),
            payment_deadline: DateTime.now().plus({ days: 3 }).toISO()
          }
        case 'payment_reminder':
          return {
            remaining_time: '24 jam',
            payment_amount: faker.number.int({ min: 100000, max: 10000000 })
          }
        case 'auction_start':
          return {
            start_price: faker.number.int({ min: 50000, max: 5000000 }),
            duration: '3 hari'
          }
        default:
          return null
      }
    }
    
    const baseData = {
      lelangId: faker.number.int({ min: 1, max: 100 }), // Akan di-override jika ada relasi
      waNumber: waNumber,
      waMessage: generateMessage(selectedInfoType),
      waStatus: selectedStatus,
      infoType: selectedInfoType,
      additionalData: generateAdditionalData(selectedInfoType),
    }
    
    // Add status-specific fields
    if (selectedStatus === 'sent') {
      return {
        ...baseData,
        sentAt: DateTime.now().minus({ hours: faker.number.int({ min: 1, max: 24 }) }),
        errorMessage: null
      }
    } else if (selectedStatus === 'failed') {
      const errorMessages = [
        'Nomor WhatsApp tidak valid',
        'Gagal mengirim pesan',
        'Koneksi timeout',
        'WhatsApp API error'
      ]
      return {
        ...baseData,
        sentAt: null,
        errorMessage: faker.helpers.arrayElement(errorMessages)
      }
    }
    
    // For pending status
    return {
      ...baseData,
      sentAt: null,
      errorMessage: null
    }
  })
  .state('pending', (row) => ({
    waStatus: 'pending' as WaStatus,
    sentAt: null,
    errorMessage: null
  }))
  .state('sent', (row) => ({
    waStatus: 'sent' as WaStatus,
    sentAt: DateTime.now().minus({ hours: 1 }),
    errorMessage: null
  }))
  .state('failed', (row) => ({
    waStatus: 'failed' as WaStatus,
    sentAt: null,
    errorMessage: 'Gagal mengirim pesan WhatsApp'
  }))
  .state('auctionStart', (row) => ({
    infoType: 'auction_start' as InfoType,
    waMessage: 'Halo! Lelang telah dimulai. Jangan lewatkan kesempatan untuk berpartisipasi!',
    additionalData: {
      start_price: 100000,
      duration: '3 hari'
    }
  }))
  .state('winnerNotification', (row) => ({
    infoType: 'winner_notification' as InfoType,
    waMessage: 'Selamat! Anda telah memenangkan lelang. Silakan lakukan pembayaran sesuai instruksi.',
    additionalData: {
      winner_bid: 500000,
      payment_deadline: DateTime.now().plus({ days: 3 }).toISO()
    }
  }))
  .build()
