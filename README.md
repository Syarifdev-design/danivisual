# 📸 DaniVisual Wedding Booking

Premium wedding photography website dengan quick booking flow untuk **DaniVisual**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PHP](https://img.shields.io/badge/PHP-8.1+-purple)
![React](https://img.shields.io/badge/React-18.3-61dafb)

---

## 🎯 Fitur Utama

- **Booking System** - Proses booking cepat dan mudah
- **Package Management** - Kelola paket foto/video
- **Portfolio Gallery** - Showcase hasil karya
- **Admin Dashboard** - Kelola bookings, payments, dan staff
- **Multi-role Access** - Super Admin, Admin, Finance, Editor, Staff
- **Attendance System** - Tracking kehadiran staff
- **KPI Tracking** - Evaluasi performa staff

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router 7** - Routing

### Backend
- **PHP 8.1+**
- **MySQL 8.0+**
- **Apache** dengan `.htaccess`

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PHP 8.1+
- MySQL 8.0+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Syarifdev-design/danivisual.git
cd danivisual

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Buka http://localhost:5173 di browser.

### Build for Production

```bash
# Build static files
npm run build

# Preview production build
npm run preview
```

---

## ⚙️ Environment Variables

### Frontend (.env)

```env
# Tidak diperlukan - menggunakan localStorage fallback
VITE_API_URL=/api
```

### Backend PHP (.env.local)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=danivisual
DB_USER=your_username
DB_PASS=your_password

# Application
APP_ENV=production
APP_URL=https://danivisual.com
CORS_ORIGINS=https://danivisual.com,https://www.danivisual.com
```

---

## 📁 Project Structure

```
danivisual/
├── api/                    # PHP Backend API
│   ├── auth/               # Authentication endpoints
│   ├── bookings/           # Booking management
│   ├── packages/           # Package management
│   ├── faqs/              # FAQ management
│   ├── portfolios/         # Portfolio management
│   ├── payments/           # Payment management
│   ├── inquiries/          # Inquiries management
│   ├── customers/          # Customer management
│   ├── content/            # CMS content
│   ├── calendar/           # Calendar events
│   ├── staff/              # Staff management
│   ├── attendance/         # Attendance tracking
│   ├── services/           # Services management
│   ├── config/             # Database configuration
│   ├── helpers/            # Helper functions
│   ├── .htaccess          # Apache config
│   └── error.php          # Error handler
│
├── src/                    # React Frontend
│   ├── app/               # Main app components
│   ├── services/           # API services
│   ├── lib/               # Utilities
│   │   ├── apiClient.ts   # HTTP client
│   │   └── supabaseClient.ts # Deprecated (fallback)
│   └── styles/            # CSS styles
│
├── public/                 # Static assets
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
│
├── database/               # MySQL schemas
│   ├── mysql-schema.sql   # Database schema
│   └── seed-data.sql     # Initial data
│
├── .htaccess              # Root Apache config
├── .env.example          # Environment template
└── README.md              # This file
```

---

## 🌐 Deployment ke Hostinger

### Step 1: Setup Database

```bash
# Login ke Hostinger Panel
# Buat MySQL database
# Import schema:
mysql -u username -p database_name < database/mysql-schema.sql

# Import seed data:
mysql -u username -p database_name < database/seed-data.sql
```

### Step 2: Upload Files

```bash
# Build project
npm run build

# Upload isi folder dist/ ke public_html/
# Upload folder api/ ke public_html/api/
# Upload file .htaccess ke public_html/
```

### Step 3: Configure Environment

Di Hostinger Dashboard → Environment Variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=danivisual
DB_USER=your_username
DB_PASS=your_password
APP_ENV=production
APP_URL=https://danivisual.com
```

### Step 4: Default Login

```
Email: admin@danivisual.com
Password: admin123
```

---

## 🔐 Security

### PHP Backend Security

- Password hashing dengan `password_hash()`
- SQL injection prevention dengan prepared statements
- XSS prevention dengan `htmlspecialchars()`
- CORS configuration untuk cross-origin requests
- Security headers (XSS, CSP, X-Frame-Options)

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access |
| `admin` | Manage content, bookings, staff |
| `finance` | View bookings, verify payments |
| `editor` | Manage portfolio, media |
| `photographer` | View assignments |
| `videographer` | View assignments |
| `staff` | Attendance, basic access |
| `customer` | Public booking only |

---

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List all bookings |
| GET | `/api/bookings/:id` | Get booking details |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id` | Update booking |

### Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List packages |
| GET | `/api/packages/:id` | Get package details |
| POST | `/api/packages` | Create package (admin) |

### FAQs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faqs` | List FAQs |
| POST | `/api/faqs` | Create FAQ (admin) |
| PUT | `/api/faqs/:id` | Update FAQ (admin) |
| DELETE | `/api/faqs/:id` | Delete FAQ (admin) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List payments |
| POST | `/api/payments` | Create payment |
| POST | `/api/payments/verify` | Verify payment |
| POST | `/api/payments/reject` | Reject payment |

---

## 🐛 Troubleshooting

### Build Error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### PHP API Error

1. Cek PHP version (`php -v` harus 8.1+)
2. Cek MySQL connection
3. Cek error log di `api/logs/`

### CORS Error

1. Cek `CORS_ORIGINS` di `.env.local`
2. Pastikan `.htaccess` sudah ter-upload
3. Cek browser console untuk detail error

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Syarifdev-design/danivisual/issues)
- **Email**: info@danivisual.com

---

## 📄 License

MIT License

---

**Made with ❤️ by DaniVisual Team**
