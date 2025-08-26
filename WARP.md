# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an AdonisJS v6 REST API for an auction system ("restAPIAdonisLelang") built in TypeScript. The application manages auctions for agricultural products, handling farmers (petanis), buyers (pembelis), products (produks), auctions (lelangs), and related business logic.

## Development Commands

### Essential Commands
```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Build the application
npm run build

# Run all tests
npm run test

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run typecheck
```

### Database Operations
```bash
# Run migrations
node ace migration:run

# Rollback migrations
node ace migration:rollback

# Create new migration
node ace make:migration table_name

# Reset database and run migrations
node ace migration:reset

# Seed database
node ace db:seed
```

### Code Generation
```bash
# Create a new controller
node ace make:controller ControllerName

# Create a new model
node ace make:model ModelName

# Create a new middleware
node ace make:middleware MiddlewareName

# Create a new validator
node ace make:validator ValidatorName

# Create migration and model together
node ace make:model ModelName -m
```

### Testing Commands
```bash
# Run unit tests only
node ace test --suites=unit

# Run functional tests only
node ace test --suites=functional

# Run tests with coverage
node ace test --coverage

# Run specific test file
node ace test tests/unit/example.spec.ts
```

## Architecture Overview

### Core Structure
The application follows AdonisJS MVC architecture with these key components:

- **Controllers**: Handle HTTP requests and responses (`app/controllers/`)
- **Models**: Lucid ORM models representing database entities (`app/models/`)
- **Middleware**: Request/response processing layers (`app/middleware/`)
- **Routes**: HTTP route definitions (`start/routes.ts`)
- **Database**: Migrations and factories (`database/`)

### Domain Models
The auction system revolves around these core entities:
- **Users**: Base authentication model
- **Petani**: Farmers who sell products
- **Pembeli**: Buyers who participate in auctions
- **Produk**: Products being auctioned
- **Lelang**: Auction instances
- **JenisProduk**: Product categories
- **PengajuanLelang**: Auction proposals
- **PenerimaanProduk**: Product receipts
- **PembayaranLelang**: Auction payments
- **FotoProdukLelang**: Product images for auctions

### Key Features
- **Authentication**: Token-based auth with AdonisJS Auth
- **Role-based Access**: Custom middleware for role checking
- **Database**: MySQL with Lucid ORM
- **Validation**: VineJS for request validation
- **CORS**: Configured for API access
- **Hot Module Replacement**: Enabled in development

### Path Aliases
The application uses import aliases defined in `package.json`:
- `#controllers/*` → `./app/controllers/*.js`
- `#models/*` → `./app/models/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#database/*` → `./database/*.js`
- `#config/*` → `./config/*.js`
- And more...

### Middleware Stack
Global middleware:
- `container_bindings_middleware`: Container bindings
- `force_json_response_middleware`: Forces JSON responses
- `cors_middleware`: CORS handling

Route middleware:
- `bodyparser_middleware`: Request body parsing
- `initialize_auth_middleware`: Auth initialization

Named middleware:
- `checkRole`: Role-based authorization
- `cekVerifikasiPembeli`: Buyer verification check
- `auth`: Authentication guard

### Database Configuration
- **Primary Database**: MySQL via mysql2 client
- **Connection**: Configured through environment variables
- **Migrations**: Auto-sorted, located in `database/migrations`
- **Environment Variables**: 
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`

### Test Configuration
- **Unit Tests**: Located in `tests/unit/`, 2-second timeout
- **Functional Tests**: Located in `tests/functional/`, 30-second timeout
- **Test Runner**: Japa with AdonisJS plugin
- **API Testing**: @japa/api-client available

## Environment Setup

Copy `.env.example` to `.env` and configure:
- Database connection settings
- APP_KEY (generate with `node ace generate:key`)
- Port and host settings
- Log level configuration

## Key Development Notes

- The application uses ES modules (`"type": "module"`)
- Hot reload boundaries are configured for controllers and middleware
- TypeScript configuration extends AdonisJS defaults
- Controllers are currently empty templates - implementation needed
- Models have basic structure but need business logic implementation
- Routes file contains only a basic "hello world" endpoint

## Important Considerations

- All controllers currently have empty implementations
- Database migrations exist but are minimal (only id and timestamps)
- No validation rules are implemented yet
- Authentication controller exists but is empty
- The application appears to be in early development stage
