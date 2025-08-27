# Pendekatan Migrasi: Terpisah vs Gabungan di AdonisJS

## Overview
AdonisJS mendukung kedua pendekatan untuk membuat migrasi database: **terpisah per tabel** atau **gabungan multiple tabel**. Berikut perbandingan keduanya.

## 1. Migrasi Terpisah (Current Implementation)

### Struktur File:
```
database/migrations/
├── 1756289819247_create_password_reset_tokens_table.ts
├── 1756289831903_create_sessions_table.ts
└── ...
```

### Keuntungan:
✅ **Separation of Concerns**: Setiap tabel memiliki file sendiri  
✅ **Granular Control**: Bisa rollback tabel secara individual  
✅ **Easy to Track**: History perubahan per tabel lebih jelas  
✅ **Team Collaboration**: Mengurangi conflict saat multiple developer  
✅ **Selective Migration**: Bisa skip migrasi tertentu jika diperlukan  

### Kekurangan:
❌ **More Files**: Lebih banyak file untuk dimanage  
❌ **Dependency Issues**: Urutan migrasi harus diperhatikan untuk FK  
❌ **Partial Failure**: Jika 1 tabel gagal, tabel lain mungkin sudah terbuat  

## 2. Migrasi Gabungan (New Alternative)

### Struktur File:
```
database/migrations/
├── 1756290174567_create_auth_related_tables.ts  // password_reset_tokens + sessions
└── ...
```

### Keuntungan:
✅ **Atomic Operation**: Semua tabel dibuat atau gagal semua  
✅ **Guaranteed Order**: Urutan pembuatan tabel terjamin  
✅ **Fewer Files**: Mengurangi jumlah file migrasi  
✅ **Related Tables**: Cocok untuk tabel yang saling terkait  
✅ **Easy Rollback**: Rollback semua tabel terkait sekaligus  

### Kekurangan:
❌ **All or Nothing**: Tidak bisa rollback tabel individual  
❌ **Large Files**: File migrasi bisa menjadi besar  
❌ **Mixed Concerns**: Satu file handle multiple responsibilities  

## Contoh Implementasi

### Pendekatan 1: Migrasi Terpisah

**File 1**: `create_password_reset_tokens_table.ts`
```typescript
export default class extends BaseSchema {
  protected tableName = 'password_reset_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('email').primary()
      table.string('token').notNullable()
      table.timestamp('created_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**File 2**: `create_sessions_table.ts`
```typescript
export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.integer('user_id').unsigned().nullable()
      // ... other fields
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### Pendekatan 2: Migrasi Gabungan

**File 1**: `create_auth_related_tables.ts`
```typescript
export default class extends BaseSchema {
  async up() {
    // Tabel 1: password_reset_tokens
    this.schema.createTable('password_reset_tokens', (table) => {
      table.string('email').primary()
      table.string('token').notNullable()
      table.timestamp('created_at').nullable()
    })

    // Tabel 2: sessions
    this.schema.createTable('sessions', (table) => {
      table.string('id').primary()
      table.integer('user_id').unsigned().nullable()
      // ... other fields
      
      // Foreign key ke users (sudah pasti ada)
      table.foreign('user_id').references('id').inTable('users')
    })
  }

  async down() {
    // Urutan drop terbalik
    this.schema.dropTable('sessions')
    this.schema.dropTable('password_reset_tokens')
  }
}
```

## Kapan Menggunakan Masing-masing?

### Gunakan Migrasi Terpisah Ketika:
- 🎯 Tabel tidak saling tergantung
- 🎯 Tim besar dengan banyak developer
- 🎯 Butuh flexibility untuk rollback individual
- 🎯 Setiap tabel memiliki lifecycle berbeda
- 🎯 Tabel mungkin diubah secara independen

### Gunakan Migrasi Gabungan Ketika:
- 🎯 Tabel saling terkait erat (FK relationships)
- 🎯 Ingin atomic operation (semua berhasil atau semua gagal)
- 🎯 Tim kecil atau single developer
- 🎯 Tabel selalu digunakan bersamaan
- 🎯 Ingin mengurangi jumlah file migrasi

## Rekomendasi untuk Proyek Anda

### Untuk `password_reset_tokens` dan `sessions`:

**Pilihan 1: Tetap Terpisah** (Current) ✅
```bash
# Keuntungan:
- Sudah implemented dan bekerja
- Sesuai dengan konvensi AdonisJS
- Mudah di-maintain
```

**Pilihan 2: Gabungkan** (Alternative)
```bash
# Keuntungan untuk case ini:
- Kedua tabel untuk authentication
- Selalu digunakan bersamaan
- Atomic creation lebih safe
```

## Migration Commands

### Untuk Migrasi Terpisah:
```bash
# Rollback individual
node ace migration:rollback --batch=2  # Rollback batch tertentu
node ace migration:rollback --step=1   # Rollback 1 migration

# Run individual
node ace migration:run --upto="1756289819247"
```

### Untuk Migrasi Gabungan:
```bash
# Rollback atomic (semua tabel dalam 1 migrasi)
node ace migration:rollback --step=1

# Run atomic
node ace migration:run
```

## Best Practices

### 1. Consistency
Pilih satu pendekatan dan konsisten di seluruh project:
```typescript
// ✅ Good: Semua auth-related tables dalam 1 file
// ✅ Good: Setiap tabel dalam file terpisah
// ❌ Bad: Mix keduanya tanpa pattern yang jelas
```

### 2. Naming Convention
```typescript
// Terpisah
create_users_table.ts
create_password_reset_tokens_table.ts
create_sessions_table.ts

// Gabungan  
create_auth_tables.ts          // users, password_reset_tokens, sessions
create_product_tables.ts       // products, categories, product_categories
create_order_tables.ts         // orders, order_items, payments
```

### 3. Documentation
```typescript
/**
 * Migrasi gabungan untuk sistem authentication:
 * - password_reset_tokens: Token untuk reset password
 * - sessions: Management session browser
 * 
 * Tables dibuat bersamaan untuk memastikan consistency
 */
export default class extends BaseSchema {
  // ...
}
```

## Kesimpulan

**Untuk proyek Anda saat ini**, saya rekomendasikan **tetap menggunakan migrasi terpisah** karena:

1. ✅ Sudah implemented dan bekerja dengan baik
2. ✅ Lebih sesuai dengan best practice AdonisJS
3. ✅ Lebih mudah untuk maintenance jangka panjang
4. ✅ Memberikan flexibility lebih tinggi

Namun, jika Anda ingin mencoba pendekatan gabungan, file `create_auth_related_tables.ts` sudah saya buatkan sebagai alternatif yang bisa langsung digunakan.

**Pilihan ada di tangan Anda!** 🚀
