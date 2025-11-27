FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.js .
ENV DB_HOST=mysql DB_PORT=3306 DB_USER=zju_user DB_PASSWORD=zju_pass DB_NAME=zju_graduate_art_troupe JWT_SECRET=change-me PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
