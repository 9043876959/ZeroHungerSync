# 🌱 ZeroHungerSync
### Food Donation & NGO Coordination Platform

> Connecting surplus food donors with NGOs to fight hunger and eliminate food waste.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

Server runs on: `http://localhost:5000`

### 2. Frontend Setup

Open `frontend/index.html` directly in your browser, or serve it with any static server:

```bash
# Using Python
cd frontend
python3 -m http.server 3000

# Using Node's http-server
npx http-server frontend -p 3000
```

---

## 📁 Project Structure

```
zerohungersync/
├── backend/
│   ├── models/
│   │   ├── User.js           # User + Food donor model
│   │   └── Notification.js   # Notification model
│   ├── routes/
│   │   ├── userRoutes.js     # /api/users
│   │   ├── foodRoutes.js     # /api/food
│   │   └── notificationRoutes.js  # /api/notifications
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html            # Homepage
    ├── about.html            # About page
    ├── register.html         # Registration page
    ├── community.html        # Community network
    ├── notifications.html    # NGO/Donor notifications
    ├── ngos.html             # NGO map & list
    ├── style.css             # Global styles
    └── app.js                # Shared JS utilities
```

---

## 🌐 API Reference

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a donor or NGO |
| GET | `/api/users` | List all active users |
| GET | `/api/users/ngos` | List all NGOs |
| GET | `/api/users/donors` | List all donors |
| DELETE | `/api/users/:id` | Soft-delete user (record preserved) |

### Food
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/food` | Create food donation |
| PATCH | `/api/food/:id/status` | Update food status |
| GET | `/api/food/available` | List available food |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/ngo/:id` | Get NGO food alerts |
| GET | `/api/notifications/donor/:id` | Get donor confirmations |
| POST | `/api/notifications/accept` | NGO accepts food donation |
| GET | `/api/notifications/all` | All notifications (admin) |

---

## 🔑 Key Features

- **Dual Registration**: Separate flows for Food Donors & NGOs
- **Location-Based Matching**: Haversine formula calculates distance between donor and NGO
- **Food Locking**: First NGO to accept locks the food; prevents double-acceptance
- **Audit Trail**: Soft deletes preserve all records permanently
- **Real-Time Polling**: Notification page auto-refreshes every 15 seconds
- **Interactive Map**: Leaflet.js map showing all NGO locations
- **Responsive UI**: Works on desktop, tablet, and mobile

---

## 🍃 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/zerohungersync
```

For MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zerohungersync
```

---

## 💡 Usage Guide

### For Food Donors:
1. Go to **Register** → Select "Food Donor"
2. Fill in food type, quantity, expiry, and location
3. Copy your **User ID** shown after registration
4. Go to **Notifications** → Enter your ID to see acceptance confirmations

### For NGOs:
1. Go to **Register** → Select "NGO"
2. Copy your **User ID** shown after registration
3. Go to **Notifications** → Enter your ID to see available food alerts
4. Click **Accept Food** to claim a donation (locks it for you)

---

Built with ❤️ to fight food waste and hunger.
