# Use Node.js base image
FROM node:18-alpine

# Install Python and other build dependencies needed for native modules
RUN apk add --no-cache docker-cli python3 make g++ py3-pip

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies with legacy peer deps and ignore optional deps
RUN npm install --legacy-peer-deps --no-optional

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]