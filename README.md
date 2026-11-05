# Bandung Tourism API

Backend API untuk aplikasi Bandung Tourism Destinations. Menyediakan data destinasi wisata di Bandung dengan RESTful API.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **ES Modules** - Modern JavaScript modules

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Buat file `.env` di root folder (atau copy dari `.env.example`):

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🏃 Running the Server

### Development (dengan auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

Server akan berjalan di: `http://localhost:3000`

## 📋 API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "OK",
  "message": "Bandung Tourism API is running",
  "timestamp": "2024-11-05T10:00:00.000Z"
}
```

### Get All Destinations

```http
GET /api/destinations
```

Response:

```json
[
  {
    "id": "1",
    "name": "Kawah Putih",
    "description": "Kawah Putih adalah sebuah danau kawah...",
    "image": "https://example.com/image.jpg",
    "location": {
      "address": "Jl. Raya Soreang - Ciwidey",
      "city": "Bandung"
    },
    "operatingHours": "07:00 - 17:00 WIB",
    "pricing": {
      "amount": 50000,
      "currency": "Rp"
    }
  }
]
```

### Get Destination by ID

```http
GET /api/destinations/:id
```

Response (Success):

```json
{
  "id": "1",
  "name": "Kawah Putih",
  ...
}
```

Response (Not Found):

```json
{
  "error": "Not Found",
  "message": "Destination with ID 999 not found"
}
```

## 📁 Project Structure

```
zel-BEPmini/
├── src/
│   ├── data/
│   │   └── destinations.js      # Data dummy destinasi
│   ├── routes/
│   │   └── destinations.js      # Route handlers
│   └── middleware/
│       └── errorHandler.js      # Error handling
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── server.js                    # Entry point
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🎯 Features (MVP Phase 1)

- ✅ GET all destinations
- ✅ GET destination by ID
- ✅ 15 dummy data destinasi wisata Bandung
- ✅ CORS configuration
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Health check endpoint

## 🔗 Integration dengan Frontend

Update file `.env` di frontend (`zel-fepmini`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📝 Data Dummy

Backend ini sudah dilengkapi dengan 15 destinasi wisata Bandung:

1. Kawah Putih
2. Tangkuban Perahu
3. Farmhouse Lembang
4. Trans Studio Bandung
5. Dusun Bambu
6. Floating Market Lembang
7. Gedung Sate
8. Saung Angklung Udjo
9. Curug Cimahi
10. The Lodge Maribaya
11. Jalan Braga
12. Tebing Keraton
13. Kampung Gajah Wonderland
14. Orchid Forest Cikole
15. Ranca Upas

## 🛠️ Development Notes

- Server menggunakan ES Modules (`"type": "module"` di package.json)
- Auto-reload tersedia dengan `npm run dev` (Node.js v18.11.0+)
- CORS sudah dikonfigurasi secure by default (fallback ke localhost:5173)
- Error handling sudah di-setup untuk production-ready dengan sanitasi pesan error

## 🔒 Production Security

- **CORS**: Pastikan set `FRONTEND_URL` di .env untuk production, tidak menggunakan wildcard `*`
- **Error Messages**: Error details di-sanitize di production mode (NODE_ENV=production)
- **Environment Variables**: Semua konfigurasi sensitive harus di .env, jangan hardcode

## 📄 License

MIT
