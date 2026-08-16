FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY . .
RUN npm run build -w client

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "run", "start", "-w", "server"]
