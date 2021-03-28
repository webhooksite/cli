FROM node:14

# Setup app directory within container
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Default command
CMD node index.js help