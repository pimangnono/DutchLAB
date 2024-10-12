# Use an official Node.js runtime as the base image
FROM node:18-alpine as build

# Set the working directory in the container
WORKDIR /app

ENV NODE_OPTIONS="--max_old_space_size=512"

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build your application for production
RUN npm run build

# Use a lightweight web server to serve the production build
FROM nginx:alpine

# Copy the production build from the previous stage to the web server's document root
COPY --from=build /app/build /usr/share/nginx/html

# Expose the port the web server is listening on (usually port 80 by default)
EXPOSE 80

# Command to start the web server (typically done automatically by the web server image)
CMD ["nginx", "-g", "daemon off;"]
