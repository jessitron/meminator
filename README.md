
# Meminator

Because a meme doesn't have to make _sense_ to be funny.

See it in action: [o11yday.jessitron.honeydemo.io](https://o11yday.jessitron.honeydemo.io)

## Be Your Own SRE: Observability for Developers

This version of the app is for a talk at KCDC 2024. If you want a version of this app in more languages (Python, Go, .NET),
then pop over to Honeycomb's [Observability Day Workshops repo](https://github.com/honeycombio/observability-day-workshop).
There's also a [Java version](https://github.com/honeycombio/academy-instrumentation-java).

## Running the application

Run this locally in docker-compose, sending traces to Honeycomb. Then you can practice improving the instrumentation for better observability.

If you don't have Docker locally, you can [run this in GitPod](https://gitpod.io/#https://github.com/honeycombio/observability-day-workshop) or use Codespaces.

### one-time setup

Clone this repository.

```bash
git clone https://github.com/honeycombio/observability-day-workshop
```

Have Docker installed.

Edit `.env` if you would like to use the python implementation rather than nodejs.

Define your Honeycomb API key. Add this to the middle of `.env`:

```bash
HONEYCOMB_API_KEY="paste your api key here"
```

If you don't have an API key handy, here are the [docs](https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/#create-api-key).
If you want more stepping-through of how to get an API key, there are instructions for this in [Observaquiz](https://quiz.honeydemo.io); type in a name to get to the second page.

### run the app

`./run`

(this will run `docker compose` in daemon mode, and build containers)

Access the app:

[http://localhost:8080]()

after making changes to a service, you can tell it to rebuild just that one:

`./run [ meminator | backend-for-frontend | image-picker | phrase-picker ]`

### Try it out

Visit [http://localhost:8080]()

Click the "GO" button. Then wait.

See [MAINTENANCE.md](MAINTENANCE.md) for instructions on updating the cached starting-point containers on Dockerhub.
