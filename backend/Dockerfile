FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend files
COPY . .

# Expose the API port 
EXPOSE 2478
EXPOSE 6379

# Start the application
CMD ["npm", "start"]
