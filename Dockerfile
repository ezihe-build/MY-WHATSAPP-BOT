# EZIHE SUPER BOT - Dockerfile
FROM node:20-alpine

# Install tools needed for the bot
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    sqlite \
    git

WORKDIR /app

COPY package*.json ./

# ADDED --legacy-peer-deps: This stops the red "ERESOLVE" errors
RUN npm install --production --legacy-peer-deps

COPY . .

RUN mkdir -p data downloads logs temp assets

EXPOSE 10000

CMD ["npm", "start"]
