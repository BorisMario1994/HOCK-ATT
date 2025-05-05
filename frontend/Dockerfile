# Use official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the frontend (uncomment if you have a build step)
RUN npm run build

# Expose the port your frontend runs on (adjust as needed)
EXPOSE 3000

# Start the frontend (adjust as needed)
CMD ["npm", "start"] 