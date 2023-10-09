FROM node:18.15.0 as base

# update packagesRUN apk update
RUN apt-get update && apt-get install -y ffmpeg libnss3 chromium
# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
# copy source code to /app/src folder
COPY . .

# check files list
#RUN ls -a

RUN yarn install
RUN yarn build
EXPOSE 80

CMD [ "yarn", "start" ]