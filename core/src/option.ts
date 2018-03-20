import { Result } from './result';

export type Option<Value> = { $: 1, _: Value; } | { $: 0 };

const none = { $: 0 };

export function option_some<Value>(val: Value): Option<Value> {
    return { $: 1, _: val };
}

export function option_none<Value>(): Option<Value> {
    return none as Option<Value>;
}

export function option_map<Value, NewValue>(fn: (_: Value) => NewValue): (opt: Option<Value>) => Option<NewValue> {
    return (opt: Option<Value>) => opt.$ ? { $: 1, _: fn(opt._) } : opt as Option<NewValue>;
}

export function option_unwrap<Value>(opt: Option<Value>) {
    if (opt.$) return opt._;
    throw "option none";
}

export function option_unwrap_or<Value>(def: Value): (opt: Option<Value>) => Value {
    return (opt: Option<Value>) => opt.$ ? opt._ : def;
}

export function option_result<Error>(err: Error): <Value>(opt: Option<Value>) => Result<Value, Error> {
    return <Value>(opt: Option<Value>) => {
        return opt.$ ? { $: 1, _: opt._ } : { $: 0, _: err };
    };
}
