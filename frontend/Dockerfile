# Stage 1: Build the frontend assets
FROM node:18-alpine AS build

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of your frontend source code
COPY . .

# Build the production-ready static files
RUN npm run build

# Stage 2: Serve the static files using nginx
FROM nginx:stable-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
