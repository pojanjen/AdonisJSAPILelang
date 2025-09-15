import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Pembeli from '#models/pembeli'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class UserSeeder extends BaseSeeder {
  async run() {
    console.log('🚀 Seeding users...')

    // Admin users data
    const adminUsersData = [
      {
        name: 'Admin Utama',
        email: 'admin@lelang.com',
        password: 'admin123',
        role: 'admin',
        emailVerifiedAt: DateTime.now(),
      },
      {
        name: 'Admin Kedua',
        email: 'admin2@lelang.com',
        password: 'admin123',
        role: 'admin',
        emailVerifiedAt: DateTime.now(),
      },
    ]

    // Check if admin users already exist
    const adminUsers = []
    for (const adminData of adminUsersData) {
      const existingUser = await User.findBy('email', adminData.email)
      if (!existingUser) {
        const user = await User.create(adminData)
        adminUsers.push(user)
      } else {
        console.log(`⚠️ Admin user ${adminData.email} already exists, skipping...`)
        adminUsers.push(existingUser)
      }
    }

    // Pembeli users data
    const pembeliUsersData = [
      {
        name: 'Budi Santoso',
        email: 'budi@gmail.com',
        password: await hash.make('password123'),
        role: 'pembeli',
        emailVerifiedAt: DateTime.now(),
      },
      {
        name: 'Siti Nurhaliza',
        email: 'siti@gmail.com',
        password: await hash.make('password123'),
        role: 'pembeli',
        emailVerifiedAt: DateTime.now(),
      },
      {
        name: 'Maya Sari',
        email: 'maya@gmail.com',
        password: await hash.make('password123'),
        role: 'pembeli',
        emailVerifiedAt: DateTime.now(),
      }
    ]

    // Create pembeli users if they don't exist
    const pembeliUsers = []
    for (const pembeliData of pembeliUsersData) {
      const existingUser = await User.findBy('email', pembeliData.email)
      if (!existingUser) {
        const user = await User.create(pembeliData)
        pembeliUsers.push(user)
      } else {
        console.log(`⚠️ Pembeli user ${pembeliData.email} already exists, skipping...`)
        pembeliUsers.push(existingUser)
      }
    }

    // Create pembeli profiles
    const pembeliProfilesData = [
      {
        userId: pembeliUsers[0].id,
        alamatPembeli: 'Jl. Merdeka No. 123, Jakarta Pusat',
        teleponPembeli: '081234567890',
        nomorRekening: '1234567890123456',
        fotoKtp: 'ktp_budi.jpg',
        statusVerifikasi: 'approved' as const,
      },
      {
        userId: pembeliUsers[1].id,
        alamatPembeli: 'Jl. Sudirman No. 456, Bandung',
        teleponPembeli: '081234567891',
        nomorRekening: '1234567890123457',
        fotoKtp: 'ktp_siti.jpg',
        statusVerifikasi: 'approved' as const,
      },
      {
        userId: pembeliUsers[2].id,
        alamatPembeli: 'Jl. Gatot Subroto No. 789, Surabaya',
        teleponPembeli: '081234567892',
        nomorRekening: '1234567890123458',
        fotoKtp: 'ktp_maya.jpg',
        statusVerifikasi: 'approved' as const,
      }
    ]

    // Check if profiles already exist before creating
    for (const profileData of pembeliProfilesData) {
      const existingProfile = await Pembeli.findBy('userId', profileData.userId)
      if (!existingProfile) {
        await Pembeli.create(profileData)
      } else {
        console.log(`⚠️ Pembeli profile for user ID ${profileData.userId} already exists, skipping...`)
      }
    }

    console.log(`✅ Created/Verified ${adminUsers.length} admin users`)
    console.log(`✅ Created/Verified ${pembeliUsers.length} pembeli users with profiles`)
  }
}
