export interface Request {
    // request url
    url: string;
    // get header value from request
    header(name: string): string[];
}
