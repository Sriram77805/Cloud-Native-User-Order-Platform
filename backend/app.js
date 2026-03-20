const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  console.log('Incoming request origin header:', req.headers.origin);
  next();
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let mongoConnected = false;

mongoose.connect(process.env.MONGO_URL, { 
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  mongoConnected = true;
  console.log('MongoDB connected successfully');
})
.catch(err => {
  mongoConnected = false;
  console.error('MongoDB connection error:', err.message);
});
mongoose.connection.once("open", () => {
  console.log("Connected DB Name:", mongoose.connection.name);
});


// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/orders", require("./routes/orderRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
