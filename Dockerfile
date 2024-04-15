FROM node:21-slim

# Setup app directory within container
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Install links
RUN npm link
RUN ln -s index.js whcli

# Default command
CMD whcli help