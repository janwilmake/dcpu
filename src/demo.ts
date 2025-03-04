// User code

import { DCPU, executeAndStreamStatus } from "./mod";

export interface Env {
  DCPU_DEMO: DurableObjectNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // this can be used anywhere where we need infinite CPU time; in a worker, in a queue, in a scheduler, or even in another DO, as long as we have env and ctx!
    return executeAndStreamStatus(env.DCPU_DEMO, ctx);
  },
};

/** User just extends the base primitive CPUDO to ensure it can do the task indefinitely */
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
        // This ensures we're not in a tight CPU loop that would prevent pings from being handled
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error("Error in CPU task:", error);
    }
  }
}
