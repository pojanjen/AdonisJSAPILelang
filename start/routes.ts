/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Import Controllers
const AuthController = () => import('#controllers/auth_controller')
const OauthController = () => import('#controllers/oauth_controller')
const JenisProdukController = () => import('#controllers/jenis_produk_controlllers_controller')
const PetanisController = () => import('#controllers/petanis_controller')
const ProduksController = () => import('#controllers/produks_controller')
const LelangsController = () => import('#controllers/lelangs_controller')
const PenerimaanProduksController = () => import('#controllers/penerimaan_produks_controller')
const PengajuanLelangsController = () => import('#controllers/pengajuan_lelangs_controller')
const PembayaranLelangsController = () => import('#controllers/pembayaran_lelangs_controller')
const PembelisController = () => import('#controllers/pembelis_controller')
const FotoProdukLelangsController = () => import('#controllers/foto_produk_lelangs_controller')
const WaInfoLelangsController = () => import('#controllers/wa_info_lelangs_controller')

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// =======================
// AUTH (PUBLIC)
// =======================
router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
}).prefix('/auth')

// =======================
// OAUTH (PUBLIC)
// =======================
router.group(() => {
  router.get('/google/redirect', [OauthController, 'redirectToGoogle'])
  router.get('/google/callback', [OauthController, 'handleGoogleCallback'])
}).prefix('/auth')


// OAuth protected route
router.group(() => {
  router.get('/oauth/user', [OauthController, 'getOAuthUser'])
}).prefix('/auth').use(middleware.auth())

// route protek buat ngetes token
router.get('/me', async ({ auth }) => auth.user).use(middleware.auth())

// Registrasi pembeli (PUBLIC)
router.post('/pembeli/register', [PembelisController, 'register'])

// =======================
// PUBLIC INFORMATION
// =======================
router.group(() => {
  // Jenis Produk
  router.get('/jenis-produk', [JenisProdukController, 'index'])
  router.get('/jenis-produk/:id', [JenisProdukController, 'show'])

  // Produk
  router.get('/produk', [ProduksController, 'index'])
  router.get('/produk/:id', [ProduksController, 'show'])

  // Lelang (publik untuk list, detail, dan aktif)
  router.get('/lelang', [LelangsController, 'index'])
  router.get('/lelang/active', [LelangsController, 'active'])
  router.get('/lelang/:id', [LelangsController, 'show'])

  // Foto Produk Lelang
  router.get('/foto-produk-lelang/lelang/:lelangId', [FotoProdukLelangsController, 'byLelang'])

  // Serve static images from storage with cache control
  // Route for Flutter Web compatibility
  router.get('/image/:path', async ({ params, response }) => {
    const { path } = params

    try {
      const { join } = await import('node:path')
      const { fileURLToPath } = await import('node:url')
      const { readFile, access } = await import('node:fs/promises')

      const __dirname = fileURLToPath(new URL('.', import.meta.url))
      const filePath = join(__dirname, '../../public/uploads', path)

      try {
        // Check if file exists
        await access(filePath)

        // Get file content
        const file = await readFile(filePath)

        // Set cache control headers for better performance
        response.header('Cache-Control', 'public, max-age=31536000') // 1 year cache

        // Set Content-Type based on file extension
        const extension = path.split('.').pop()?.toLowerCase() || ''
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'pdf': 'application/pdf'
        }

        const contentType = mimeTypes[extension] || 'application/octet-stream'
        return response.header('Content-Type', contentType).send(file)
      } catch (error) {
        return response.status(404).send({ error: 'File not found' })
      }
    } catch (error) {
      console.error('File serving error:', error)
      return response.status(500).send({ error: 'Failed to retrieve file' })
    }
  }).where('path', '.*')

  // ⚠️ Jangan expose daftar bid publik (lelang tertutup)
  // router.get('/pengajuan-lelang/lelang/:lelangId', [PengajuanLelangsController, 'byLelang']) // HAPUS / JANGAN DIPAKAI
}).prefix('/public')

// =======================
// PROTECTED (AUTH)
// =======================
router.group(() => {
  // Profile & session
  router.group(() => {
    router.get('/profile', [AuthController, 'profile'])
    router.post('/logout', [AuthController, 'logout'])
    router.put('/update-password', [AuthController, 'updatePassword'])
  }).prefix('/auth')

  // -----------------------
  // Pembeli login (belum/tidak terverifikasi)
  // -----------------------
  router.group(() => {
    // Upload KTP & cek status verifikasi
    router.post('/verifikasi/upload-ktp', [PembelisController, 'uploadKtp'])
    router.get('/verifikasi/status', [PembelisController, 'cekStatusVerifikasi'])
    router.put('/update-profile', [PembelisController, 'updateProfile'])
  }).prefix('/pembeli').use(middleware.checkRole({ roles: ['pembeli'] }))

  // -----------------------
  // Pembeli terverifikasi
  // -----------------------
  router.group(() => {
    // Pengajuan lelang (BID) — privat per-user
    router.post('/pengajuan-lelang', [PengajuanLelangsController, 'store'])
    router.get('/pengajuan-lelang', [PengajuanLelangsController, 'index']) // daftar bid milik user
    router.get('/pengajuan-lelang/:id', [PengajuanLelangsController, 'show']) // detail bid user
    router.get('/pengajuan-lelang/lelang/:lelangId/me', [PengajuanLelangsController, 'myLastBid']) // last bid user pada lelang tertentu
    router.get('/history', [PengajuanLelangsController, 'history'])

    // Pembayaran
    router.post('/pembayaran', [PembayaranLelangsController, 'store'])
    router.get('/pembayaran', [PembayaranLelangsController, 'index'])
    router.get('/pembayaran/:id', [PembayaranLelangsController, 'show'])

    // Riwayat user
    router.get('/:id/riwayat-bid', [PembelisController, 'riwayatBid'])
    router.get('/:id/riwayat-kemenangan', [PembelisController, 'riwayatKemenangan'])
  }).prefix('/pembeli').use([
    middleware.checkRole({ roles: ['pembeli'] }),
    middleware.cekVerifikasiPembeli()
  ])

  // -----------------------
  // Admin only
  // -----------------------
  router.group(() => {
    // Jenis Produk
    router.post('/jenis-produk', [JenisProdukController, 'store'])
    router.put('/jenis-produk/:id', [JenisProdukController, 'update'])
    router.delete('/jenis-produk/:id', [JenisProdukController, 'destroy'])

    // Petani
    router.get('/petani', [PetanisController, 'index'])
    router.post('/petani', [PetanisController, 'store'])
    router.get('/petani/:id', [PetanisController, 'show'])
    router.put('/petani/:id', [PetanisController, 'update'])
    router.delete('/petani/:id', [PetanisController, 'destroy'])

    // Produk
    router.get('/produk', [ProduksController, 'index'])
    router.post('/produk', [ProduksController, 'store'])
    router.put('/produk/:id', [ProduksController, 'update'])
    router.delete('/produk/:id', [ProduksController, 'destroy'])

    // Lelang (CRUD & close)
    router.post('/lelang', [LelangsController, 'store'])
    router.put('/lelang/:id', [LelangsController, 'update'])
    router.put('/lelang/:id/close', [LelangsController, 'close'])
    router.delete('/lelang/:id', [LelangsController, 'destroy'])

    // Penerimaan Produk
    router.get('/penerimaan-produk', [PenerimaanProduksController, 'index'])
    router.post('/penerimaan-produk', [PenerimaanProduksController, 'store'])
    router.get('/penerimaan-produk/:id', [PenerimaanProduksController, 'show'])
    router.put('/penerimaan-produk/:id', [PenerimaanProduksController, 'update'])
    router.delete('/penerimaan-produk/:id', [PenerimaanProduksController, 'destroy'])
    router.get('/penerimaan-produk/lelang/:lelangId', [PenerimaanProduksController, 'byLelang'])

    // Pengajuan Lelang (admin menentukan pemenang / cleanup)
    router.put('/pengajuan-lelang/:id/pemenang', [PengajuanLelangsController, 'setPemenang'])
    router.delete('/pengajuan-lelang/:id', [PengajuanLelangsController, 'destroy'])

    // Pembayaran Lelang
    router.put('/pembayaran/:id/status', [PembayaranLelangsController, 'updateStatus'])
    router.delete('/pembayaran/:id', [PembayaranLelangsController, 'destroy'])

    // Pembeli
    router.get('/pembeli', [PembelisController, 'index'])
    router.get('/pembeli/:id', [PembelisController, 'show'])
    router.put('/pembeli/:id', [PembelisController, 'update'])
    router.delete('/pembeli/:id', [PembelisController, 'destroy'])

    // Verifikasi Pembeli
    router.get('/pembeli/verifikasi/daftar', [PembelisController, 'daftarVerifikasi'])
    router.put('/pembeli/:id/verifikasi/approve', [PembelisController, 'approveVerifikasi'])
    router.put('/pembeli/:id/verifikasi/reject', [PembelisController, 'rejectVerifikasi'])

    // Foto Produk Lelang
    router.get('/foto-produk-lelang', [FotoProdukLelangsController, 'index'])
    router.post('/foto-produk-lelang', [FotoProdukLelangsController, 'store'])
    router.put('/foto-produk-lelang/:id', [FotoProdukLelangsController, 'update'])
    router.delete('/foto-produk-lelang/:id', [FotoProdukLelangsController, 'destroy'])

    // Info WA Lelang
    router.get('/wa-info-lelang', [WaInfoLelangsController, 'index'])
    router.post('/wa-info-lelang', [WaInfoLelangsController, 'store'])
    router.get('/wa-info-lelang/:id', [WaInfoLelangsController, 'show'])
    router.put('/wa-info-lelang/:id', [WaInfoLelangsController, 'update'])
    router.delete('/wa-info-lelang/:id', [WaInfoLelangsController, 'destroy'])
    router.get('/wa-info-lelang/pembeli/:pembeliId', [WaInfoLelangsController, 'byPembeli'])

    // Manajemen Verifikasi Pembeli (ADMIN)
    router.group(() => {
      router.get('/', [PembelisController, 'daftarVerifikasi'])
      router.post('/:id/approve', [PembelisController, 'approveVerifikasi'])
      router.post('/:id/reject', [PembelisController, 'rejectVerifikasi'])
    }).prefix('/verifikasi-pembeli')
  }).prefix('/admin').use(middleware.checkRole({ roles: ['admin'] }))
}).use(middleware.auth())
