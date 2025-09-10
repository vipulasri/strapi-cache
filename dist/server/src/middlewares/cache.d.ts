import { Context } from 'koa';
declare const middleware: (ctx: Context, next: any) => Promise<void>;
export default middleware;
