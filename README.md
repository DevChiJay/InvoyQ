# InvoyQ

Modern invoice and inventory management platform with AI-powered document extraction. Built for businesses to manage clients, products, invoices, and expenses seamlessly across web and mobile.

## 📁 Project Structure

```
InvoyQ/
├── backend/          # FastAPI + MongoDB backend with AI extraction
├── frontend/         # Next.js web application
└── mobile/           # React Native (Expo) mobile app
```

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

**Stack:** FastAPI • MongoDB • OpenAI API • JWT Auth • Email Service

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Stack:** Next.js 15 • React • TypeScript • TailwindCSS • shadcn/ui

### Mobile
```bash
cd mobile
npm install
npx expo start
```

**Stack:** Expo SDK 52+ • React Native • TypeScript • React Query • Axios

## ✨ Features

- 🤖 **AI Document Extraction** - Extract invoice data from screenshots using OpenAI
- 📄 **Invoice Management** - Create, track, send invoices with PDF generation
- 📦 **Inventory & Products** - Manage product catalog with stock tracking
- 👥 **Client Management** - Organize customer records and history
- 💰 **Expense Tracking** - Monitor business expenses with categorization
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 📧 **Email Notifications** - Automated invoices and payment reminders
- 💳 **Payment Integration** - Paystack and Stripe support
- 📱 **Cross-Platform** - Web and native mobile apps (iOS/Android)
- 🌐 **Offline Support** - Mobile app works offline with sync
- 🎨 **Modern UI** - Consistent design across all platforms

## 🔗 Development URLs

- **API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **Web App**: `http://localhost:3000`
- **Mobile**: Expo Go app (scan QR code)

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests  
cd frontend
npm test
```

## 📦 Database

MongoDB with indexed collections for clients, products, invoices, expenses, and users. See [backend/db/indexes_spec.py](backend/db/indexes_spec.py) for schema details.

## 📝 License

MIT

---

For detailed setup instructions and documentation, see the README files in each project folder.
