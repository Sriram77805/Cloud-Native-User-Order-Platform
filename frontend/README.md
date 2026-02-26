# Cloud Native Platform - Frontend

A modern React frontend application for managing orders with secure JWT authentication.

## Features

- 🔐 **User Authentication** - Register and login with secure password hashing
- 📦 **Order Management** - Create, read, update, and delete orders
- 🔒 **JWT Token Security** - Secure API communication with Bearer tokens
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Fast & Efficient** - Built with React for optimal performance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000` in your browser.

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── components/         # Reusable components
│   │   ├── Navbar.js
│   │   ├── OrderForm.js
│   │   └── OrderList.js
│   ├── pages/              # Page components
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   └── Orders.js
│   ├── services/           # API services
│   │   └── api.js          # Axios instance & API calls
│   ├── styles/             # CSS stylesheets
│   │   ├── AuthPages.css
│   │   ├── Navbar.css
│   │   ├── Dashboard.css
│   │   ├── Orders.css
│   │   ├── OrderForm.css
│   │   └── OrderList.css
│   ├── App.js              # Main App component
│   ├── App.css
│   └── index.js            # React entry point
├── .env                    # Environment variables
├── package.json            # Dependencies & scripts
└── README.md              # This file
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner in interactive watch mode

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User login

### Orders
- `POST /orders` - Create new order (requires auth)
- `GET /orders` - Get all user orders (requires auth)
- `PUT /orders/:id` - Update order status (requires auth)
- `DELETE /orders/:id` - Delete order (requires auth)

## Usage

### 1. Register
- Navigate to the Register page
- Enter email and password
- Click Register
- You'll be redirected to login

### 2. Login
- Enter your email and password
- Click Login
- You'll be redirected to the dashboard

### 3. Manage Orders
- Click "Orders" in the navigation
- Click "+ New Order" to create an order
- Fill in product name, quantity, and price
- Click "Create Order"
- You can edit status or delete orders from the list

## Technologies Used

- **React** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with gradients and animations

## Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:3000
```

## Deployment

### Build for Production

```bash
npm build
```

This creates an optimized production build in the `build` folder.

### Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect your repository to Vercel/Netlify
3. Set `REACT_APP_API_URL` environment variable to your backend URL
4. Deploy!

## Troubleshooting

### CORS Errors
Make sure your backend is running and the `REACT_APP_API_URL` matches your backend URL.

### Token Issues
Clear your browser's local storage if authentication fails:
- Open DevTools (F12)
- Go to Application → Local Storage
- Clear all entries

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
