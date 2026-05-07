declare namespace Bun {
  function serve<T>(options: {
    port?: number;
    fetch(req: Request, server: Server): Response | undefined;
    websocket?: {
      open?(ws: ServerWebSocket<T>): void;
      message?(ws: ServerWebSocket<T>, message: string | Buffer): void;
      close?(ws: ServerWebSocket<T>): void;
      drain?(ws: ServerWebSocket<T>): void;
    };
  }): Server;
}
interface Server {
  upgrade<T>(req: Request, options?: { data?: T; headers?: HeadersInit }): boolean;
}
interface ServerWebSocket<T> {
  data: T;
  send(data: string | Buffer): void;
  close(): void;
  remoteAddress: string;
}
interface Buffer extends Uint8Array {}
