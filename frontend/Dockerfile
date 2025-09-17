# Use Node.js official image (regular)
FROM node:19

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8002

# Start the application
CMD ["npm", "start"]
