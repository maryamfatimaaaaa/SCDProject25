# Dockerfile

FROM node:18-alpine



# Create app directory

WORKDIR /usr/src/app



# Copy package files

COPY package*.json ./



# Install dependencies

RUN npm ci --only=production



# Copy app source

COPY . .



# Create non-root user

RUN addgroup -g 1001 -S nodejs && \

    adduser -S nodejs -u 1001 && \

    chown -R nodejs:nodejs /usr/src/app

USER nodejs



# Expose port

EXPOSE 3000



# Start command

CMD ["node", "main.js"]
