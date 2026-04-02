# EZIHE SUPER BOT - Dockerfile
FROM node:20-alpine

# Added git to the apk add list
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    sqlite \
    git

WORKDIR /app

COPY package*.json ./

# This will now work because 'git' is available to download the Xeon socket
RUN npm install --production

COPY . .

RUN mkdir -p data downloads logs temp assets

EXPOSE 10000

CMD ["npm", "start"]
