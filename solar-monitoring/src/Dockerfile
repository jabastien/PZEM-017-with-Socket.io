# build environment
FROM node:10.13.0 as build
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --silent
COPY . /usr/src/app
RUN yarn build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html

RUN apk add openssl
RUN mkdir /etc/nginx/ssl; \
    cd /etc/nginx/ssl && openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d


EXPOSE 5002
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]