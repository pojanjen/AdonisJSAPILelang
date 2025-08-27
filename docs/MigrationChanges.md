# Migrasi dari Laravel ke AdonisJS - Perubahan Database

## Overview
Dokumen ini menjelaskan perubahan yang dilakukan untuk mengkonversi migrasi Laravel ke format AdonisJS, khususnya untuk tabel `users`, `password_reset_tokens`, dan `sessions`.

## Tabel yang Diubah/Ditambahkan

### 1. Tabel `users` ✅
**File**: `database/migrations/1756218965071_create_users_table.ts`

**Perubahan yang dilakukan:**
- ❌ **Dihapus**: `full_name` 
- ✅ **Ditambahkan**: `name` (sesuai Laravel)
- ✅ **Ditambahkan**: `email_verified_at` (nullable timestamp)
- ✅ **Ditambahkan**: `remember_token` (nullable string, max 100 karakter)

**Struktur Akhir:**
```typescript
table.increments('id')
table.string('name').notNullable()
table.string('email', 254).notNullable().unique()
table.timestamp('email_verified_at').nullable()
table.string('password').notNullable()
table.string('remember_token', 100).nullable()
table.timestamp('created_at').notNullable().defaultTo(this.now())
table.timestamp('updated_at').notNullable().defaultTo(this.now())
```

### 2. Tabel `password_reset_tokens` ✅ (BARU)
**File**: `database/migrations/1756289819247_create_create_password_reset_tokens_table.ts`

**Struktur:**
```typescript
table.string('email').primary()      // Primary key adalah email
table.string('token').notNullable()  // Token reset password
table.timestamp('created_at').nullable()  // Waktu pembuatan
```

**Fitur Model:**
- Auto-generate secure token menggunakan `crypto.randomBytes()`
- Method `isExpired()` untuk cek expiration (default 1 jam)
- Method `createForEmail()` untuk create/replace token

### 3. Tabel `sessions` ✅ (BARU)
**File**: `database/migrations/1756289831903_create_create_sessions_table.ts`

**Struktur:**
```typescript
table.string('id').primary()                    // Custom string primary key
table.integer('user_id').unsigned().nullable()  // FK ke users (nullable)
table.string('ip_address', 45).nullable()       // IP address
table.text('user_agent').nullable()             // Browser info
table.text('payload', 'longtext')               // Session data (JSON)
table.integer('last_activity').index()          // Unix timestamp
```

**Fitur Model:**
- Primary key berupa string (bukan auto-increment)
- Method untuk parse/set payload sebagai JSON
- Method untuk cek session aktif
- Helper untuk convert timestamp ke DateTime

## Model yang Diupdate

### 1. Model `User` ✅
**File**: `app/models/user.ts`

**Perubahan:**
- ✅ **Ditambahkan**: `emailVerifiedAt: DateTime | null`
- ✅ **Ditambahkan**: `rememberToken: string | null`
- ✅ **Hidden dari serialization**: `password` dan `rememberToken`

### 2. Model `PasswordResetToken` ✅ (BARU)
**File**: `app/models/password_reset_token.ts`

**Fitur utama:**
- Custom primary key (`email`)
- Auto-generate secure token
- Expiration checking
- Cleanup method untuk replace token

### 3. Model `Session` ✅ (BARU)
**File**: `app/models/session.ts`

**Fitur utama:**
- Custom string primary key
- JSON payload handling
- Activity tracking
- Relasi ke User model

## Perbedaan dengan Struktur Laravel

| Aspek | Laravel | AdonisJS | Keterangan |
|-------|---------|-----------|------------|
| **Primary Key Style** | `id()` | `increments('id')` | AdonisJS lebih eksplisit |
| **Timestamp Defaults** | Auto-handled | Manual `defaultTo(this.now())` | AdonisJS perlu set manual |
| **Foreign Keys** | `foreignId()->constrained()` | `foreign().references().inTable()` | Syntax berbeda |
| **JSON Fields** | `json()` | `json()` | Sama |
| **Enum Fields** | `enum()` | `enum()` | Sama |

## Konversi Yang Dilakukan

### Laravel Migration (Original):
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->rememberToken();
    $table->timestamps();
});
```

### AdonisJS Migration (Converted):
```typescript
this.schema.createTable(this.tableName, (table) => {
  table.increments('id')
  table.string('name').notNullable()
  table.string('email', 254).notNullable().unique()
  table.timestamp('email_verified_at').nullable()
  table.string('password').notNullable()
  table.string('remember_token', 100).nullable()
  
  table.timestamp('created_at').notNullable().defaultTo(this.now())
  table.timestamp('updated_at').notNullable().defaultTo(this.now())
})
```

## Status Migrasi

Semua migrasi berhasil dijalankan:

```
✅ users table - Updated dengan field Laravel
✅ access_tokens table - Existing (AdonisJS auth)
✅ password_reset_tokens table - Baru (sesuai Laravel)
✅ sessions table - Baru (sesuai Laravel)
✅ wa_info_lelangs table - Existing (custom)
✅ + 8 tabel lainnya (lelang system)
```

## Cara Penggunaan

### Password Reset
```typescript
import PasswordResetToken from '#models/password_reset_token'

// Buat token untuk reset password
const token = await PasswordResetToken.createForEmail('user@example.com')

// Cek apakah token expired
if (token.isExpired()) {
  // Token sudah expired
}
```

### Session Management
```typescript
import Session from '#models/session'

// Buat session baru
const session = await Session.create({
  id: 'unique-session-id',
  userId: 1,
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0...',
  payload: JSON.stringify({ data: 'session-data' }),
  lastActivity: Math.floor(Date.now() / 1000)
})

// Update activity
session.updateActivity()
await session.save()
```

### User dengan Email Verification
```typescript
import User from '#models/user'

const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123'
})

// Mark email as verified
user.emailVerifiedAt = DateTime.now()
await user.save()
```

## Catatan Penting

1. **Foreign Key Constraints**: Beberapa FK constraint sementara dihilangkan untuk menghindari error urutan migrasi
2. **Timestamp Handling**: AdonisJS memerlukan explicit default values untuk timestamp
3. **Primary Key**: Session menggunakan string PK, bukan auto-increment
4. **Model Naming**: Mengikuti konvensi AdonisJS (PascalCase untuk model, snake_case untuk tabel)

## Migrasi Selanjutnya

Jika diperlukan, bisa menambahkan:
- Foreign key constraints yang dihilangkan
- Index tambahan untuk performa
- Tabel tambahan yang diperlukan Laravel (failed_jobs, notifications, dll)
