# RentalInventory backend starter

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your MongoDB Atlas connection URI. Replace username/password placeholders and URL-encode special characters in the password. Never commit `.env`.
3. Open a terminal in this `backend` folder and run:
   ```bash
   npm install
   npm run dev
   ```
4. Check `http://localhost:5000/api/health`.

## API routes
- `GET /api/equipment`
- `POST /api/equipment`
- `GET /api/equipment/:id`
- `PUT /api/equipment/:id`
- `DELETE /api/equipment/:id`
- `GET /api/rentals`
- `GET /api/rentals/overdue`
- `POST /api/rentals` (creates an active rental and decrements availability)
- `POST /api/rentals/:id/return` (marks returned and restores stock)

Note: rental/return transactions require MongoDB Atlas (replica set), which Atlas clusters support.
