# PembeliController Update - Laravel to AdonisJS Conversion

## Update Summary
Updated PembeliController untuk menyesuaikan dengan versi Laravel terbaru yang memiliki fitur-fitur tambahan.

## New Features Added

### 1. **Riwayat Bid Pembeli**
```typescript
// Laravel: PembeliController::riwayatBid($id)
public async riwayatBid({ params, response }: HttpContext)
```
- Mengambil riwayat bid pembeli berdasarkan user_id pembeli
- Menampilkan bid terakhir dari setiap lelang yang sudah selesai
- Group by lelang_id dan ambil yang terbaru

### 2. **Riwayat Kemenangan Pembeli**
```typescript
// Laravel: PembeliController::riwayatKemenangan($id)
public async riwayatKemenangan({ params, response }: HttpContext)
```
- Mengambil riwayat kemenangan pembeli berdasarkan user_id
- Include relasi lelang, produk, jenis produk, petani, dan pembayaran
- Filter by `isPemenang = 'ya'`

### 3. **Upload KTP untuk Verifikasi**
```typescript
// Laravel: PembeliController::uploadKtp(Request $request)
public async uploadKtp({ request, auth, response }: HttpContext)
```
- Pembeli dapat mengupload foto KTP
- Auto-delete foto KTP lama jika ada
- Validasi file: jpg, jpeg, png dengan max 2MB
- Update/create pembeli record

### 4. **Cek Status Verifikasi**
```typescript
// Laravel: PembeliController::cekStatusVerifikasi()
public async cekStatusVerifikasi({ auth, response }: HttpContext)
```
- Pembeli dapat mengecek status verifikasinya sendiri
- Return status_verifikasi dan alasan_penolakan

### 5. **Update Profile dengan Enhanced Logging**
```typescript
// Laravel: PembeliController::updateProfile(Request $request)
public async updateProfile({ request, auth, response }: HttpContext)
```
**Enhanced Features:**
- ✅ DEBUG logging untuk troubleshooting
- ✅ Force update user name dan pembeli data
- ✅ Foto KTP handling dengan status verifikasi logic
- ✅ Transaction handling
- ✅ Tidak bisa update KTP jika sudah approved

### 6. **Admin Verification Methods**
```typescript
// Laravel equivalents for admin verification
public async daftarVerifikasi({ response }: HttpContext)        // Admin melihat daftar pending
public async approveVerifikasi({ params, response }: HttpContext) // Admin approve verifikasi
public async rejectVerifikasi({ params, request, response }: HttpContext) // Admin reject dengan alasan
```

## Technical Improvements

### Database Transactions
```typescript
const trx = await db.transaction()
try {
  // Operations with { client: trx }
  await trx.commit()
} catch (error) {
  await trx.rollback()
  // Error handling
}
```

### Enhanced Error Handling
```typescript
// Consistent error response format
return response.internalServerError({
  success: false,
  message: 'Error message',
  error: error.message,
})
```

### File Upload Handling
```typescript
// Proper file validation and handling
const validator = vine.compile(
  vine.object({
    foto_ktp: vine.file({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png'],
    }),
  })
)

// Safe file deletion
if (existsSync(oldFilePath)) {
  await unlink(oldFilePath)
}
```

### Enhanced Logging
```typescript
// Debug logging for troubleshooting
logger.info('Update Profile Request', {
  user_id: user.id,
  request_all: request.all(),
})

logger.error('Update Profile Error', {
  message: error.message,
  trace: error.stack,
})
```

## API Endpoints

### New Endpoints Added:
```
// Pembeli riwayat
GET    /pembeli/:id/riwayat-bid          - Riwayat bid pembeli
GET    /pembeli/:id/riwayat-kemenangan   - Riwayat kemenangan pembeli

// Pembeli verifikasi
POST   /pembeli/verifikasi/upload-ktp    - Upload foto KTP
GET    /pembeli/verifikasi/status        - Cek status verifikasi
PUT    /pembeli/update-profile           - Update profile dengan foto KTP

// Admin verifikasi (sudah ada di routes)
GET    /admin/pembeli/verifikasi/daftar              - Daftar pengajuan verifikasi
PUT    /admin/pembeli/:id/verifikasi/approve         - Approve verifikasi
PUT    /admin/pembeli/:id/verifikasi/reject          - Reject verifikasi
```

## Laravel vs AdonisJS Comparison

### Laravel Implementation:
```php
// Upload KTP
$path = $request->file('foto_ktp')->store('ktp', 'public');
Pembeli::updateOrCreate(['user_id' => $user->id], ['foto_ktp' => $path]);

// Debug logging
\Log::info('Update Profile Request', ['user_id' => $user->id]);

// Validation
$request->validate(['foto_ktp' => 'required|image|mimes:jpeg,png,jpg|max:2048']);
```

### AdonisJS Implementation:
```typescript
// Upload KTP
const fileName = `${user.id}_${Date.now()}.${payload.foto_ktp.extname}`
await payload.foto_ktp.move(app.makePath('public/uploads/ktp'), { name: fileName })

// Debug logging
logger.info('Update Profile Request', { user_id: user.id })

// Validation
const validator = vine.compile(vine.object({
  foto_ktp: vine.file({ size: '2mb', extnames: ['jpg', 'jpeg', 'png'] })
}))
```

## Status Verifikasi Logic

```typescript
// Status flow: null -> pending -> approved/rejected
// Rules:
// 1. Tidak bisa update KTP jika status = 'approved'
// 2. Upload KTP baru akan set status ke 'pending'
// 3. Jika di-reject, upload ulang akan reset ke 'pending'

if (pembeli.statusVerifikasi === 'approved') {
  return response.badRequest({
    success: false,
    message: 'Foto KTP tidak dapat diubah karena akun sudah terverifikasi'
  })
}

const hadPreviousKtp = pembeli.fotoKtp !== null
if (pembeli.statusVerifikasi === 'rejected' || !hadPreviousKtp) {
  pembeli.statusVerifikasi = 'pending'
  pembeli.alasanPenolakan = null
}
```

## File Storage Structure

```
public/
  uploads/
    ktp/
      1_1640995200000.jpg    // {user_id}_{timestamp}.{ext}
      2_1640995300000.png
```

## Testing

### Postman Collection:
```json
{
  "name": "Pembeli Controller - Updated",
  "requests": [
    {
      "name": "Upload KTP",
      "method": "POST",
      "url": "{{base_url}}/pembeli/verifikasi/upload-ktp",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "form-data": {
          "foto_ktp": "file"
        }
      }
    },
    {
      "name": "Cek Status Verifikasi",
      "method": "GET",
      "url": "{{base_url}}/pembeli/verifikasi/status",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Update Profile",
      "method": "PUT",
      "url": "{{base_url}}/pembeli/update-profile",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "form-data": {
          "name": "Updated Name",
          "alamat_pembeli": "Updated Address",
          "telepon_pembeli": "08123456789",
          "foto_ktp": "file (optional)"
        }
      }
    },
    {
      "name": "Riwayat Bid",
      "method": "GET",
      "url": "{{base_url}}/pembeli/:id/riwayat-bid",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Riwayat Kemenangan",
      "method": "GET",
      "url": "{{base_url}}/pembeli/:id/riwayat-kemenangan",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

## Notes

1. **File Upload**: Menggunakan `vine.file()` untuk validasi file upload
2. **Transaction**: Semua operasi database menggunakan transaction untuk consistency
3. **Logging**: Enhanced logging untuk debugging dan monitoring
4. **Security**: File KTP hanya bisa diupdate jika belum terverifikasi
5. **Error Handling**: Consistent error response format
6. **Performance**: Efficient query dengan proper preloading

## Migration from Laravel

Semua fitur Laravel sudah berhasil di-convert ke AdonisJS dengan:
- ✅ Same functionality
- ✅ Better error handling
- ✅ Enhanced logging
- ✅ Transaction support
- ✅ File upload validation
- ✅ Proper response format

**PembeliController sekarang 100% equivalent dengan Laravel version!** 🎉
