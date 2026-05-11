# FeedBack Backend Foundation

This backend scaffold uses Node.js, Express.js, Prisma ORM, PostgreSQL, JWT authentication, and role-based access control. It is intentionally focused on the authentication foundation so future feature modules can be added cleanly.

## Installation

```bash
cd backend
npm install
```

## Environment Setup

Create a `.env` file from `.env.example` and update the values:

```bash
cp .env.example .env
```

Required variables:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Prisma Setup

Prisma 7 reads the database connection string from `prisma.config.ts`, so `schema.prisma` only defines the provider.

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init_auth
```

## Run The Server

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/pending-approvals` (admin only)
- `PATCH /api/auth/users/:userId/approval` (admin only)
- `GET /api/auth/ngo/pending` (admin only)
- `PATCH /api/auth/ngo/:userId/approval` (admin only)

## NGO Registration

Register NGO accounts with `multipart/form-data`. Uploaded NGO documents are sent to Cloudinary, and the database stores the Cloudinary URLs and public IDs for admin review.

Required text fields for `role=NGO`:

- `name`
- `email`
- `password`
- `role`
- `ngoOrganizationName`
- `ngoRegistrationNumber`
- `ngoContactPhone`
- `ngoAddress`
- `ngoDescription`

Required file fields for `role=NGO`:

- `ssmDocument` (1 file, PDF/JPG/PNG/WEBP, max 5 MB)

Optional file fields:

- `supportingDocuments` (up to 3 files, PDF/JPG/PNG/WEBP, max 5 MB each)

NGO users are created with `PENDING` approval status and cannot log in until an admin approves them.

## Vendor Registration

Register vendor accounts with `multipart/form-data`.

Required text fields for `role=VENDOR`:

- `name`
- `email`
- `password`
- `role`
- `vendorBusinessName`
- `vendorRegistrationNumber`
- `vendorPlaceAddress`
- `vendorContactPhone`

Optional text fields:

- `vendorDescription`

Required file fields:

- `vendorSsmDocument` (1 file, PDF/JPG/PNG/WEBP, max 5 MB)

Vendor SSM documents are uploaded to Cloudinary, but vendor accounts do not require admin approval.

## Rider Registration

Register rider accounts with `multipart/form-data`.

Required text fields for `role=RIDER`:

- `name`
- `email`
- `password`
- `role`
- `riderLicenseNumber`
- `riderPhoneNumber`
- `riderVehicleType`
- `riderVehicleName`
- `riderVehiclePlateNumber`
- `riderAddress`

Optional text fields:

- `riderVehicleColor`
- `riderNotes`

Required file fields:

- `riderLicenseDocument` (1 file, PDF/JPG/PNG/WEBP, max 5 MB)
- `riderVehicleGrantDocument` (1 file, PDF/JPG/PNG/WEBP, max 5 MB)

Rider document uploads are stored in Cloudinary, and rider accounts are created with `PENDING` approval status until an admin approves them.

## Cloudinary Setup

Set these environment variables before using NGO document uploads:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Example Register Request

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123",
  "role": "INDIVIDUAL"
}
```

## Roles

- `INDIVIDUAL`
- `NGO`
- `VENDOR`
- `RIDER`
- `ADMIN`
