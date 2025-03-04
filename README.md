# DCPU - Durable Object with Infinite CPU Time

DCPU is a Cloudflare Workers package that provides a solution for running CPU-intensive tasks without hitting the typical time limits of serverless functions. It uses Durable Objects to maintain state and continue processing by implementing a ping mechanism that keeps the execution alive.

## Features

- Run CPU-intensive tasks indefinitely on Cloudflare Workers
- Stream real-time status updates back to clients
- Simple API for extending and implementing your own CPU-intensive workloads
- Works in any Cloudflare Workers environment: standalone workers, queues, schedulers, or even nested in other Durable Objects

## Installation

1. Install the package:

```bash
npm install dcpu
```

2. Configure your `wrangler.toml` to include the Durable Object:

```toml
# replace the name class name with your DO class name of preference
[durable_objects]
bindings = [
  { name = "YOUR_DO_NAME", class_name = "DCPUDemo" }
]

[[migrations]]
tag = "v1"
new_classes = ["DCPUDemo"]
```

3. Import and extend the DCPU class in your project:

```typescript
import { DCPU } from "dcpu";
```

## Usage Example

The included demo shows how to implement a prime number finder that runs continuously:

```typescript
import { DCPU, executeAndStreamStatus } from "dcpu";

export interface Env {
  DCPU_DEMO: DurableObjectNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Execute and stream the results back to the client
    return executeAndStreamStatus(env.DCPU_DEMO, ctx);
  },
};

/** Extend the base DCPU class to implement your CPU-intensive task */
export class DCPUDemo extends DCPU {
  protected data: { primes: number[] } = { primes: [] };
  protected status: string = "";

  // CPU-intensive task that will run continuously but yield to allow pings
  protected async task(signal: AbortSignal) {
    try {
      while (!signal.aborted) {
        const start =
          this.data.primes.length > 0
            ? this.data.primes[this.data.primes.length - 1] + 1
            : 2;
        let current = start;

        primeSearch: while (true) {
          const sqrt = Math.sqrt(current);

          // Check if current number is divisible by any number up to its square root
          for (let i = 2; i <= sqrt; i++) {
            // Do extra calculations to make this more CPU intensive
            for (let j = 0; j < 5000; j++) {
              (Math.pow(i, 2) * Math.log(current)) / Math.sin(j * 0.01);
            }

            if (current % i === 0) {
              current++;
              continue primeSearch;
            }
          }

          // If we get here, current is prime
          this.data.primes.push(current);
          this.status = `Primes found: ${this.data.primes.length}`;
          break;
        }

        // Yield to allow handling of incoming pings (crucial for extending CPU time)
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error("Error in CPU task:", error);
    }
  }
}
```

## How It Works

1. The DCPU base class provides three endpoints:

   - `/start`: Begins the CPU-intensive task
   - `/ping`: Returns the current status
   - `/stop`: Stops the running task

2. The `executeAndStreamStatus` function:

   - Creates a new instance of your Durable Object
   - Starts the task
   - Sets up a ping loop to keep the Durable Object alive
   - Streams the status back to the client

3. Your implementation extends `DCPU` and provides:
   - A `task` method that performs your CPU-intensive work
   - A `status` property to track and report progress

## Important Notes

- Always include yields in your task (via `setTimeout(resolve, 0)`) to allow ping requests to be processed
- The default streaming limit is 5 minutes, but you can customize this
- The actual computation continues even after the stream ends

## License

MIT
