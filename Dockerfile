
# Stage 1: Build stage
FROM node:18-alpine as development

WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy the built application from the development stage
COPY --from=development /app/dest ./

# Start the application
CMD ["node", "dest/index.js"]


