# EZIHE SUPER BOT - Dockerfile
FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    sqlite

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# CHANGE HERE: Use 'install' instead of 'ci' to fix the EUSAGE error
RUN npm install --production

# Copy app source
COPY . .

# Create necessary directories
RUN mkdir -p data downloads logs temp assets

# Expose port
EXPOSE 10000

# Start the bot
CMD ["node", "start"]
