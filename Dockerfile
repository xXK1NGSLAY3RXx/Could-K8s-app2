FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 7000

RUN mkdir "/arta_PV_dir"
CMD ["node", "container2.js"]
