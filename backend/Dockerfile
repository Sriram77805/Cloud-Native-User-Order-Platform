# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start backend
CMD ["node", "app.js"]
