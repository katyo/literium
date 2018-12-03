import { Option, Result, Emit, HasField, ok, err, constant, do_seq, then_ok, ok_some_or, map_ok, mix_to, keyed } from '@literium/base';
import { Method, Status, StatusKind, ErrorKind, Error, ApiTag, PluginApi, Plugin, ProgressType, Progress, FromArg, FromArgFn, IntoRes, IntoResFn, Named, FromArgOrWithEmit, BodyType, BodyTypeMap, plugin_fail, plugin_done } from './types';

const euc = encodeURIComponent;
const pass = ok() as Result<void, string>;

function to_string<T>(arg: T): Result<string, string> {
    return ok('' + arg);
}

function to_body<T extends BodyType = BodyType.String>(ty: T = BodyType.String as T): (data: BodyTypeMap[T]) => Result<BodyTypeMap[T], string> {
    return data => ty == (typeof data == "string" ? BodyType.String : BodyType.Binary) ? ok(data) :
        err(`unexpected body type '${ty == BodyType.Binary ? "string" : "binary"}'`);
}

/// Set request method
///
/// method_use(Method.Get)
export function method_use<A, R>(method: Method): Plugin<A, R> {
    return api => {
        if (api.$ == ApiTag.Request) {
            api.m(method);
        }
        return plugin_done;
    };
}

/// Set origin for request from args using function
export function origin_with<A, R>(fn: (args: A) => Result<string, string>): Plugin<A, R> {
    return (api, arg) => {
        if (api.$ == ApiTag.Request) {
            const r = fn(arg);
            if (!r.$) return plugin_fail(keyed(ErrorKind.IntoHead, r._));
            api.o(r._);
        }
        return plugin_done;
    };
}

/// Set origin for request from args
///
/// origin_from()("base")
export function origin_from(): FromArg<string>;
export function origin_from<T>(fn: (arg: T) => Result<string, string>): FromArg<T>;
export function origin_from<T>(fn: (arg: T) => Result<string, string> = to_string): FromArg<T> {
    return <A extends T | { [F in K]: T }, K extends keyof A>(field?: K) =>
        origin_with((arg: A) => field == null ? fn(arg as T) :
                  field in arg ? fn((arg as { [F in K]: T })[field]) :
                  err(`missing field '${arg}' for origin`));
}

/// Set origin for request url
///
/// origin_use("http://example.com/")
export function origin_use<A, R>(origin: string): Plugin<A, R> {
    return origin_with(constant(ok(origin)));
}

/// Set path for request from args using function
export function path_with<A, R>(fn: (args: A) => Result<string, string>): Plugin<A, R> {
    return (api, arg) => {
        if (api.$ == ApiTag.Request) {
            const r = fn(arg);
            if (!r.$) return plugin_fail(keyed(ErrorKind.IntoHead, r._));
            api.p(r._);
        }
        return plugin_done;
    };
}

/// Set path for request from args
///
/// path_from("field")
export function path_from(): FromArg<string>;
export function path_from<T>(fn: (arg: T) => Result<string, string>): FromArg<T>;
export function path_from<T>(fn: (arg: T) => Result<string, string> = to_string): FromArg<T> {
    return <A extends T | { [F in K]: T }, K extends keyof A>(field?: K) =>
        path_with((arg: A) => field == null ? fn(arg as T) :
                  field in arg ? fn((arg as { [F in K]: T })[field]) :
                  err(`missing field '${arg}' for path`));
}

/// Set path for request
///
/// path_use("path/to/resource")
export function path_use<A, R>(path: string): Plugin<A, R> {
    return path_with(constant(ok(path)));
}

/// Set query argument using function
///
/// query_with("search", args => ok(args.phrase))
export function query_arg_with<A, R>(name: string, fn: (args: A) => Result<string, string>): Plugin<A, R> {
    return (api, arg) => {
        if (api.$ == ApiTag.Request) {
            const r = fn(arg);
            if (r.$) {
                api.q(euc(name) + '=' + euc(r._));
            } else {
                return plugin_fail(keyed(ErrorKind.IntoHead, r._));
            }
        }
        return plugin_done;
    };
}

/// Set query argument for request
///
/// query_arg_use("search", "rust tokio")
export function query_arg_use<A, R>(name: string, value: string): Plugin<A, R> {
    return query_arg_with(name, constant(ok(value)));
}

/// Set query argument by extracting value from args
///
/// query_arg_from("q")("phrase")
export function query_arg_from(): Named<FromArg<string>>;
export function query_arg_from<T>(fn: (arg: T) => Result<string, string>): Named<FromArg<T>>;
export function query_arg_from<T>(fn: (arg: T) => Result<string, string> = to_string): Named<FromArg<T>> {
    return name =>
        <A extends T | { [F in K]: T }, K extends keyof A>(field?: K) =>
        query_arg_with(name, (arg: A) => field == null ? fn(arg as T) :
                       field in arg ? fn((arg as { [F in K]: T })[field]) :
                       err(`missing field '${arg}' for query arg ${name}`));
}

/// Set url for request from args using function
export function url_with<A, R>(fn: (args: A) => Result<string, string>): Plugin<A, R> {
    return (api, arg) => {
        if (api.$ == ApiTag.Request) {
            const r = fn(arg);
            if (!r.$) return plugin_fail(keyed(ErrorKind.IntoHead, r._));
            let p = r._.split('?');
            api.p(p[0]);
            if (p[1]) api.q(p[1]);
        }
        return plugin_done;
    };
}

/// Set url for request from args
///
/// url_from()("field")
export function url_from(): FromArg<string>;
export function url_from<T>(fn: (arg: T) => Result<string, string>): FromArg<T>;
export function url_from<T>(fn: (arg: T) => Result<string, string> = to_string): FromArg<T> {
    return <A extends T | { [F in K]: T }, K extends keyof A>(field?: K) =>
        url_with((arg: A) => field == null ? fn(arg as T) :
                 field in arg ? fn((arg as { [F in K]: T })[field]) :
                 err(`missing field '${arg}' for url`));
}

/// Set url for request
///
/// url("path/to/resource?arg=val")
export function url_use<A, R>(path: string): Plugin<A, R> {
    return url_with(constant(ok(path)));
}

/// Set request header using function
///
/// header_with("content-type", args => ok(args.mime))
export function header_with<A, R>(name: string, fn: (args: A) => Result<string, string>): Plugin<A, R> {
    return (api, arg) => {
        if (api.$ == ApiTag.RequestHeaders) {
            const r = fn(arg);
            if (r.$) {
                api.h(name, r._);
            } else {
                return plugin_fail(keyed(ErrorKind.IntoHead, r._));
            }
        }
        return plugin_done;
    };
}

/// Set request header
///
/// header_use("content-type", "application/json")
export function header_use<A, R>(name: string, value: string): Plugin<A, R> {
    return header_with(name, constant(ok(value)));
}

/// Set request header by extracting value from args
///
/// header_from("content-type", "mime")
export function header_from(): Named<FromArg<string>>;
export function header_from<T>(fn: (arg: T) => Result<string, string>): Named<FromArg<T>>;
export function header_from<T>(fn: (arg: T) => Result<string, string> = to_string): Named<FromArg<T>> {
    return name =>
        <A extends T | { [F in K]: T }, K extends keyof A>(field?: K) =>
        header_with(name, (arg: A) => field == null ? fn(arg as T) :
                    field in arg ? fn((arg as { [F in K]: T })[field]) :
                    err(`missing field '${arg}' for header ${name}`));
}

/// Set request body using function
///
/// body_with()(args => ok(args.payload))
/// body_with(BodyType.Binary)(args => ok(args.payload))
export function body_with(): <A, R>(fn: (args: A) => Result<string, string>) => Plugin<A, R>;
export function body_with<T extends BodyType>(ty: T): <A, R>(fn: (arg: A, res: R) => Result<BodyTypeMap[T], string>) => Plugin<A, R>;
export function body_with<T extends BodyType>(ty: T = BodyType.String as T): <A, R>(fn: (arg: A, res: R) => Result<BodyTypeMap[T], string>) => Plugin<A, R> {
    const to = to_body(ty);
    return fn => (api, arg, res) => {
        if (api.$ == ApiTag.RequestBody) {
            const r = do_seq(fn(arg, res), then_ok(to));
            if (r.$) {
                if (ty == BodyType.String) {
                    api.s(r._ as string);
                } else {
                    api.b(r._ as ArrayBuffer);
                }
            } else {
                return plugin_fail(keyed(ErrorKind.IntoBody, `invalid request body: ${r._}`));
            }
        }
        return plugin_done;
    };
}

/// Set request body from args
///
/// body_from()()("payload")
export function body_from<B extends BodyType>(ty: B): FromArgFn<BodyTypeMap[B]>;
export function body_from(): FromArgFn<BodyTypeMap[BodyType.String]>;
export function body_from<B extends BodyType>(ty: B = BodyType.String as B): <T>(fn?: (body: T, arg: any, res: any) => Result<BodyTypeMap[B], string>) => FromArg<T> {
    return <T>(fn: (body: T & BodyTypeMap[B], arg: any, res: any) => Result<BodyTypeMap[B], string> = ok) =>
        <A extends T | { [F in K]: T & BodyTypeMap[B] }, K extends keyof A>(field?: K) =>
        body_with(ty)((arg, res) => field == null ? fn(arg as T & BodyTypeMap[B], arg, res) :
                      field in arg ? fn((arg as { [F in K]: T & BodyTypeMap[B] })[field], arg, res) :
                      err(`missing field '${arg}' for body`));
}

/// Set request body
///
/// body()("constant body")
export function body_use(): <A, R>(body: string) => Plugin<A, R>;
export function body_use<T extends BodyType>(ty: T): <A, R>(body: BodyTypeMap[T]) => Plugin<A, R>;
export function body_use<T extends BodyType>(ty: T = BodyType.String as T): <A, R>(body: BodyTypeMap[T]) => Plugin<A, R> {
    return body => body_with(ty)(constant(ok(body)));
}

/// Handle response status using function
export function status_proc<A, R>(fn: (status: Status, message: string, arg: A, res: R) => Result<void, string>): Plugin<A, R> {
    return (api, arg, res) => {
        if (api.$ == ApiTag.Response) {
            const r = fn(api.s, api.m, arg, res);
            if (!r.$) return plugin_fail(keyed(ErrorKind.FromHead, r._));
        }
        return plugin_done;
    };
}

/// Expect response status
export function status_exact<A, R>(expected: Status): Plugin<A, R> {
    return status_proc(actual => actual == expected ? pass : err(`unexpected status '${actual}' when '${expected}' expected`));
}

/// Expect response status kind
export function status_expect<A, R>(kind: StatusKind): Plugin<A, R> {
    return status_proc(status => status / 100 == kind ? pass : err(`invalid status '${status}' when '${kind}xx' expected`));
}

/// Extract status code into field of result
export function status_into(): IntoRes<Status>;
export function status_into<T>(fn: (status: Status) => Result<T, Error>): IntoRes<T>;
export function status_into<T>(fn: (status: Status) => Result<T | Status, Error> = ok): IntoRes<T> {
    return <F extends keyof R, A, R extends T | HasField<F, T>>(field?: F) => status_proc((status, _message, _arg: A, res: R) => {
        const r = fn(status);
        if (r.$) {
            if (field == null) {
                mix_to(res, r._);
            } else {
                (res as HasField<F, T>)[field] = r._ as T;
            }
        } else {
            
        }
        return pass;
    });
}

/// Expect response message to be exact
export function reason_exact<A, R>(expected: string): Plugin<A, R> {
    return status_proc((_, actual) => actual == expected ? pass : err(`unexpected reason '${actual}' when '${expected}' expected`));
}

/// Expect response status kind
export function reason_expect<A, R>(pattern: string | RegExp): Plugin<A, R> {
    return status_proc((_, reason) => reason.search(pattern) != -1 ? pass : err(`invalid reason '${reason}' when '${pattern}' expected`));
}

/// Extract status message into field of result
export function reason_into(): IntoRes<string>;
export function reason_into<T>(fn: (reason: string) => Result<T, Error>): IntoRes<T>;
export function reason_into<T>(fn: (reason: string) => Result<T | string, Error> = ok): IntoRes<T> {
    return <F extends keyof R, A, R extends T | HasField<F, T>>(field?: F) => status_proc((_status, reason, _arg: A, res: R) => {
        const r = fn(reason);
        if (r.$) {
            if (field == null) {
                mix_to(res, r._);
            } else {
                (res as HasField<F, T>)[field] = r._ as T;
            }
        } else {
            
        }
        return pass;
    });
}

/// Handle response header using function
export function header_proc<A, R>(name: string, fn: (value: Option<string>, arg: A, res: R) => Result<void, string>): Plugin<A, R> {
    return (api, arg, res) => {
        if (api.$ == ApiTag.ResponseHeaders) {
            const r = fn(api.h(name), arg, res);
            if (!r.$) return plugin_fail(keyed(ErrorKind.FromHead, r._));
        }
        return plugin_done;
    };
}

/// Expect response header exact matching
export function header_exact<A, R>(name: string, expected: string, optional: boolean = false): Plugin<A, R> {
    return header_proc(name, actual => !actual.$ ? (optional ? pass : err(`missing header ${name}`)) : actual._ === expected ? pass : err(`unexpected header '${actual._} when '${expected}' expected`));
}

/// Expect response header contains
export function header_expect<A, R>(name: string, expected: string | RegExp, optional: boolean = false): Plugin<A, R> {
    return header_proc(name, actual => !actual.$ ? (optional ? pass : err(`missing header ${name}`)) : actual._.search(expected) != -1 ? pass : err(`unexpected header '${actual._} when '${expected}' expected`));
}

/// Extract header into field of result
export function header_into(): Named<IntoRes<string>>;
export function header_into<T>(fn: (value: Option<string>, name: string) => Result<T, string>): Named<IntoRes<T>>;
export function header_into<T>(fn: (value: Option<string>, name: string) => Result<string | T, string> = (value, name) => ok_some_or(`missing header '${name}'`)(value)): Named<IntoRes<T>> {
    return name => <A, R extends T | { [X in F]: T }, F extends keyof R>(field?: F) =>
        header_proc(name, (value: Option<string>, _arg: A, res: R) => {
            const r = fn(value, name);
            return r.$ ? (field == null ? mix_to(res, r._) : (res as { [X in F]: T })[field] = r._ as T, pass) : err(r._);
        });
}

/// Handle response body using function
export function body_proc(): <A, R>(fn: (body: string, arg: A, res: R) => Result<void, string>) => Plugin<A, R>;
export function body_proc<T extends BodyType>(ty: T): <A, R>(fn: (body: BodyTypeMap[T], arg: A, res: R) => Result<void, string>) => Plugin<A, R>;
export function body_proc<T extends BodyType>(ty: T = BodyType.String as T): <A, R>(fn: (body: BodyTypeMap[T], arg: A, res: R) => Result<void, string>) => Plugin<A, R> {
    let to = to_body(ty);
    return fn => (api, arg, res) => {
        switch (api.$) {
            case ApiTag.ResponseBody:
                api.b(ty);
                break;
            case ApiTag.ResponseStringBody:
            case ApiTag.ResponseBinaryBody:
                const r = do_seq(
                    to(api.$ == ApiTag.ResponseStringBody ? api.s : api.b),
                    then_ok(body => fn(body, arg, res))
                );
                if (!r.$) return plugin_fail(keyed(ErrorKind.FromBody, `invalid response body: ${r._}`));
        }
        return plugin_done;
    };
}

/// Put response body as field into result
export function body_into<B extends BodyType>(ty: B): IntoResFn<BodyTypeMap[B]>;
export function body_into(): IntoResFn<BodyTypeMap[BodyType.String]>;
export function body_into<B extends BodyType>(ty: B = BodyType.String as B): <T>(fn?: (body: BodyTypeMap[B], arg: any, res: any) => Result<T, string>) => IntoRes<T> {
    return <T>(fn: (body: BodyTypeMap[B], arg: any, res: any) => Result<T | BodyTypeMap[B], string> = ok) =>
        <F extends keyof R, A, R extends T | HasField<F, T | BodyTypeMap[B]>>(field?: F) =>
        body_proc(ty)((body, arg: A, res: R) => do_seq(
            fn(body, arg, res),
            map_ok((body: T | BodyTypeMap[B]) => {
                if (field == null) {
                    mix_to(res, body);
                } else {
                    (res as HasField<F, T | BodyTypeMap[B]>)[field] = body;
                }
            })));
}

/// Match response body content
///
/// body_exact()("complete")
export function body_exact<A, R>(): (body: BodyTypeMap[BodyType.String]) => Plugin<A, R>;
export function body_exact<T extends BodyType, A, R>(ty: T): (body: BodyTypeMap[T]) => Plugin<A, R>;
export function body_exact<T extends BodyType, A, R>(ty: T = BodyType.String as T): (body: BodyTypeMap[T]) => Plugin<A, R> {
    return expected => body_proc(ty)(actual => actual === expected ? pass : err(`mismatch body '${actual}' when '${expected}' expected`));
}

/// Set progress handler
export function progress_emit(ty: ProgressType): FromArgOrWithEmit<Progress>;
export function progress_emit(): FromArgOrWithEmit<Progress>;
export function progress_emit(ty: ProgressType = ProgressType.Both): FromArgOrWithEmit<Progress> {
    return <F extends keyof A, A extends HasField<F, Emit<Progress>>>(emit_or_field: Emit<Progress> | F) =>
        (api: PluginApi, arg: A) => {
            if (api.$ == ApiTag.RequestBody && (ty & ProgressType.Upload) ||
                api.$ == ApiTag.ResponseBody && (ty & ProgressType.Download)) {
                const emit: Emit<Progress> | void = typeof emit_or_field == 'function' ? emit_or_field : arg[emit_or_field];
                if (typeof emit == 'function') api.p(emit);
            }
            return plugin_done;
        };
}
