export declare class DCPU {
    private state;
    private controller;
    private env;
    protected status: {};
    constructor(state: DurableObjectState, env: any);
    fetch(request: Request): Promise<Response>;
    protected task(signal: AbortSignal, env: any): Promise<void>;
}
/** Use this in any worker, queue consumer, or anywhere else, to call the task and stream the status back.
 *
 * Defaults to a timeout of 300 seconds
 */
export declare const executeAndStreamStatus: (DO: DurableObjectNamespace, ctx: ExecutionContext, timeoutSeconds?: number) => Promise<Response>;
//# sourceMappingURL=mod.d.ts.map