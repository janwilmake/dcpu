// DCPU package code
// Durable Object implementation
export class DCPU {
    constructor(state, env) {
        this.controller = null;
        this.status = {};
        this.done = false;
        this.state = state;
        this.env = env;
    }
    // Handler for fetch requests to the Durable Object
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/start") {
            const data = await request.json();
            // Create a new abort controller for this run
            this.controller = new AbortController();
            const signal = this.controller.signal;
            // Start the CPU-intensive task without awaiting
            this.task(signal, this.env, data)
                .catch((error) => {
                const message = error?.message;
                console.log("Catched in DCPU: ", message);
                this.status = message;
            })
                .finally(() => {
                // execute this after it's done
                this.done = true;
            });
            return new Response("CPU task started", { status: 200 });
        }
        else if (url.pathname === "/ping") {
            // Return the current state
            return new Response(JSON.stringify({
                status: this.status,
                // if this is true, we'll break from pinging more
                done: this.done,
            }), { headers: { "Content-Type": "application/json" } });
        }
        else if (url.pathname === "/stop") {
            if (this.controller) {
                this.controller.abort();
                this.controller = null;
            }
            return new Response("CPU task stopped", { status: 200 });
        }
        return new Response("Invalid endpoint", { status: 400 });
    }
    async task(signal, env, data) {
        // this shall be replaced
        console.log("Your extension of this class needs a task function");
    }
}
/** Use this in any worker, queue consumer, or anywhere else, to call the task and stream the status back.
 *
 * Defaults to a timeout of 300 seconds
 */
export const executeAndStreamStatus = async (DO, ctx, 
/** will be provided to your task */
data, 
/** @default 300 */
timeoutSeconds = 300) => {
    // Create a new instance of the Durable Object
    const id = DO.newUniqueId();
    const durableObj = DO.get(id);
    // Start the CPU-intensive task
    await durableObj.fetch(new Request("https://dummy-url/start", {
        method: "POST",
        body: data ? JSON.stringify(data) : "{}",
    }));
    // Stream the progress back to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    // Function to ping the Durable Object and write the response to the stream
    const pingAndStream = async () => {
        try {
            let count = 0;
            while (true) {
                const response = await durableObj.fetch(new Request("https://dummy-url/ping"));
                const json = await response.json();
                await writer.write(new TextEncoder().encode(`${new Date().toISOString()} - ${JSON.stringify(json)}\n`));
                if (json.done) {
                    break;
                }
                // Wait 1 second before the next ping
                await new Promise((resolve) => setTimeout(resolve, 1000));
                // Stop after 5 minutes (300 seconds) to prevent indefinite streaming
                count++;
                if (count >= timeoutSeconds) {
                    break;
                }
            }
        }
        catch (error) {
            await writer.write(new TextEncoder().encode(`Error: ${error}\n`));
        }
        finally {
            await writer.close();
        }
    };
    // Start the ping loop without awaiting it
    ctx.waitUntil(pingAndStream());
    return new Response(readable, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
        },
    });
};
