FROM docker.io/node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /data

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the data directory
RUN chown -R nodejs:nodejs /data

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]