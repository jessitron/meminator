# For workshop facilitators


## upgrading node libraries

in each service:

```bash
cat package.json | jq '.dependencies | keys[]' -r | grep opentelemetry | sed 's/$/@latest/' |  xargs npm i
``

## Publishing

To get new versions of the containers on Dockerhub for caching, log in appropriately.

Make sure the `platforms:` option is present in the docker-compose (we remove it for faster development)

set PROGRAMMING_LANGUAGE to what you need.

push `latest` tag:

`docker compose build --push`

push tag that is used for cache-from:

```bash
source .env
IMAGE_TAG=${IMAGE_VERSION} docker compose build --push
```

... for each $PROGRAMMING_LANGUAGE implemented. (currently nodejs and python)

## Deploying

See [k8s/README.md](k8s/README.md) for my notes on deploying to Kubernetes.


## Structure of the Application

Check `docker-compose.yaml` to see the different services.

Most of them are available in multiple languages.

### web

The frontend is static files in `services/web/static`

The `services/web` directory also contains a Dockerfile and config for nginx to serve these. The nginx config also directs anything to /backend toward the backend-for-frontend service.

This one is not multi-language. Sorry, the browser runs JS.

### backend-for-frontend

this one receives /createPicture (which the client sends as /backend/createPicture; nginx strips the prefix)
and it calls out to the other services.

### image-picker

the images are in my (jessitron's) S3 bucket, 'random-pictures'.
They really could be anywhere. The service has a hard-coded list.

### phrase-picker

Easiest one. hard-coded list of phrases.

### meminator

This one will always be in a Docker container, because it has 'imagemagick' installed, and a font, and a jpg library.

It downloads the image to the local filesystem, then runs imagemagick to overlay the text, then returns the result (as binary image data).

It throws files in /tmp, which it never cleans out.
