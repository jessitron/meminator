
# Meminator

Because a meme doesn't have to make _sense_ to be funny.

See it in action: [o11yday.jessitron.honeydemo.io](https://o11yday.jessitron.honeydemo.io)

## Be Your Own SRE: Observability for Developers

This version of the app is for a talk at KCDC 2024. If you want a version of this app in more languages (Java, Python, Go, .NET),
then pop over to Honeycomb's [Observability Day Workshops repo](https://github.com/honeycombio/observability-day-workshop).

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

## Improving the tracing

The app begins with automatic instrumentation installed. Test the app, look at the tracing... how could it be better?

Here's my daily for looking at the most recent traces:

* log in to Honeycomb
* (you should be in the same environment where you got the API key; if you're not sure, there's [my little app](https://honeycomb-whoami.glitch.me) that calls Honeycomb's auth endpoint and tells you.)

See the data:

* Click New Query on the left
* At the top, it says 'New Query in &lt;dropdown&gt;' -- click the dropdown and pick the top option, "All datasets in ..."
* click 'Run Query'. Now you have a count of all events (trace spans, logs, and metrics). If it's 0, you're not getting data :sad:
* If you want to take a look at all the data, click on 'Events' under the graph.

Get more info (optional):
* change the time to 'Last 10 minutes' to zoom in on just now.
* In the query, click under 'GROUP BY' and add 'service.name' as a group-by field. GROUP BY means "show me the values please." 
* 'Run Query' again. (alt-enter also does it)
* Now see the table under the graph. You should see all 4 services from this app listed.

Get to a trace:
* In the graph, click on one of the lines. It brings up a popup menu.
* In the menu, click "View Trace"

This should take you to a trace view!

Does your trace include all 4 services?

## Workshop Facilitator Notes

First, ask them to clone this repo, log in to Docker Desktop to they don't get rate limited, and run `docker compose up`. Some of them will probably need to use GitPod or CodeSpaces because they brought their work laptop and it is locked down.

While that's going, show them the few intro slides.

Then walk them through getting an API Key in Honeycomb. I tell them to create a new team, unless they already have a personal team for play.

Tell them to put the API key in .env, and then restart the app. If they see traces in Honeycomb, victory. 

### Flow through improving the traces

Really, whatever problem shows up, drill into it and talk through how to improve the instrumentation.
There's more here than fits in 1.5 hours.

#### Python

1. Start in Python. The traces are nicer there.
2. Notice, maybe that some fail, or maybe that some are slower than others.
3. See that you don't have important data like "which image was it?"
4. Go to backend-for-frontend-python/server.py and **add attributes to the current span**.
4. Rerun just that service: `./run backend-for-frontend`
5. Maybe notice that there are some metrics coming in, in unknown_metrics. Look at the events in them, at the fields they have available. They're useless. Talk about how these would be better as attributes on the spans.
5. Remove the metrics in backend-for-frontend-python/Dockerfile. This is an opportunity to talk about how otel is added from the outside in python.
6. In meminator-python/server.py, un-comment-out the CustomSpanProcessor bit at the top. Show how the custom processor is adding the free space in /tmp, which it measures at most 1x/sec.
7. Maybe notice (in the traces) that there's a blank space in meminator. After it downloads the file, what does it do? 
8. in meminator-python/server.py, create a span around the subprocess call.

#### Node
There are different problems in node.js

1. change PROGRAMMING_LANGUAGE in .env to nodejs
2. `docker compose down` and `./run` to restart
3. Push go (or run the loadgen) and look at traces.
4. The obvious major problem is that the traces aren't connected. Propagation is broken.
5. Drill from backend-for-frontend-nodejs/index.ts into fetchFromService. It uses `fetch`. The autoinstrumentation (right now) doesn't include this.
4. The code is there to implement propagation manually, in case you want to talk about that. But the library exists now
5. Go to backend-for-frontend-nodejs/tracing.ts, and add UndiciInstrumentation. Rerun the service & see connected traces. Notice the values in span.kind
6. Maybe notice that there's a crapton of blahblah from fs-instrumentation. Show them library.name
7. Disable the fs-instrumentation in backend-for-frontend-nodejs/tracing.ts. Note that i leave it on for meminator because meminator does meaningful stuff in the filesystem. It's already off for phrase-picker and image-picker.

THe story of a feature flag: nodejs has a feature flag around the imagemagick call, with a separate implementation that runs 25% of the time (or whatever is set in featureFlags.ts). We want to know whether the new way is faster.

You can look at which takes longer by feature flag, but if you drill into a few traces, often the download dominates. We need to see more clearly this particular piece, but there's no span around it. (at least, not when it works the old way. Austin's code for the library is already instrumented.)

8. Maybe notice an empty space in a trace, in the meminator. We need a span around some unit of work. In meminator-nodejs/index.ts, add a span around the whole featureFlag check. Watch: you can add this 2 different ways. Start with startSpan (marked with INSTRUMENTATION 1). Don't forget to end the span.
9. Then add a span in spawnProcess. You always want a span around something like that. Don't forget to end the span.
10. Run again and notice that the two new spans are siblings. They shouldn't be!
11. NOw go back to meminator-nodejs/index.ts and change to startActiveSpan, marked with INSTRUMENTATION 2. Close the block at the bottom.
12. Now you should see the child span. This is a useful concept to know.

Once you have the new span in place, and loadgen runs for a bit, you should be able to compare the execution times of the two operations. They're pretty close in my observations so far, the library isn't the big win we thought it would be. Graph the heatmap, the AVG, and the P99 and discuss.

#### The AWS SDK version of Node

There's yet another version of the app that uses the AWS SDK instead of hard-coded URLs.

Run this version with `docker compose -f docker-compose-awssdk.yaml up --build`

To run this, you need to have AWS creds set up for `devrel-sandbox`.

Look at the traces, and see that the SDK calls are already instrumented! It looks pretty cool.

### Checklist before starting the workshop

- .env should be set to the starting language (in main branch and on your computer)
- additional tracing stuff that you'll add during the workshop should be commented out
- run your app locally
- make sure you're seeing traces in Honeycomb
- run the load generator in scripts/loadgen.sh
- Dockerfile should not contain `platform:...` bits. Comment out all 5 of them.

### updating code

See [MAINTENANCE.md](MAINTENANCE.md) for instructions on updating the cached starting-point containers on Dockerhub.
