FROM node:22-alpine

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy application source
COPY . .

# Build frontend production bundle
RUN cd client && npm run build

EXPOSE 5050

CMD ["node", "server/server.js"]
