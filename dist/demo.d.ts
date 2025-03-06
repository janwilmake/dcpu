import { DCPU } from "./mod";
export interface Env {
    DCPU_DEMO: DurableObjectNamespace;
}
declare const _default: {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};
export default _default;
/** User just extends the base primitive CPUDO to ensure it can do the task indefinitely */
export declare class DCPUDemo extends DCPU {
    protected data: {
        primes: number[];
    };
    protected status: string;
    protected task(signal: AbortSignal, env: Env, data: {}): Promise<void>;
}
//# sourceMappingURL=demo.d.ts.map