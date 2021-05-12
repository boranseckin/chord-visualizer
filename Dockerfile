FROM node:current-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "src/app.js"]
