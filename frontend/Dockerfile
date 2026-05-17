# Stage 1: Build Image
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json 
COPY package.json .

# Install dependencies
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Build the frontend application
RUN npm run build

# Stage 2: Serve over Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our tailored config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
