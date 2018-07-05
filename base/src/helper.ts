export function identity<Value>(_: Value): Value { return _; }

export function dummy(): void { }

export function tuple<V1>(v1: V1): [V1];
export function tuple<V1, V2>(v1: V1, v2: V2): [V1, V2];
export function tuple<V1, V2, V3>(v1: V1, v2: V2, v3: V3): [V1, V2, V3];
export function tuple<V1, V2, V3, V4>(v1: V1, v2: V2, v3: V3, v4: V4): [V1, V2, V3, V4];
export function tuple<V1, V2, V3, V4, V5>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5): [V1, V2, V3, V4, V5];
export function tuple<V1, V2, V3, V4, V5, V6>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6): [V1, V2, V3, V4, V5, V6];
export function tuple<V1, V2, V3, V4, V5, V6, V7>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7): [V1, V2, V3, V4, V5, V6, V7];
export function tuple<V1, V2, V3, V4, V5, V6, V7, V8>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7, v8: V8): [V1, V2, V3, V4, V5, V6, V7, V8];
export function tuple<V1, V2, V3, V4, V5, V6, V7, V8, V9>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7, v8: V8, v9: V9): [V1, V2, V3, V4, V5, V6, V7, V8, V9];
export function tuple(...vs: any[]): any[] {
    return vs;
}

export function mk_seq<S, T1>(): (this: S, _: T1) => T1;
export function mk_seq<S, T1, T2>(f1: (this: S, _: T1) => T2): (this: S, _: T1) => T2;
export function mk_seq<S, T1, T2, T3>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3): (this: S, _: T1) => T3;
export function mk_seq<S, T1, T2, T3, T4>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4): (this: S, _: T1) => T4;
export function mk_seq<S, T1, T2, T3, T4, T5>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5): (this: S, _: T1) => T5;
export function mk_seq<S, T1, T2, T3, T4, T5, T6>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6): (this: S, _: T1) => T6;
export function mk_seq<S, T1, T2, T3, T4, T5, T6, T7>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7): (this: S, _: T1) => T7;
export function mk_seq<S, T1, T2, T3, T4, T5, T6, T7, T8>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8): (this: S, _: T1) => T8;
export function mk_seq<S, T1, T2, T3, T4, T5, T6, T7, T8, T9>(f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8, f8: (this: S, _: T8) => T9): (this: S, _: T1) => T9;
export function mk_seq<S>(...fs: ((this: S, _: any) => any)[]): (this: S, _: any) => any {
    return function(_: any): any {
        for (const f of fs) {
            _ = f.call(this, _);
        }
        return _;
    };
}

export function do_seq<S, T1>(this: S, _: T1): T1;
export function do_seq<S, T1, T2>(this: S, _: T1, f1: (this: S, _: T1) => T2): T2;
export function do_seq<S, T1, T2, T3>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3): T3;
export function do_seq<S, T1, T2, T3, T4>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4): T4;
export function do_seq<S, T1, T2, T3, T4, T5>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5): T5;
export function do_seq<S, T1, T2, T3, T4, T5, T6>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6): T6;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7): T7;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7, T8>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8): T8;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7, T8, T9>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8, f8: (this: S, _: T8) => T9): T9;
export function do_seq<S>(this: S, _: any, ...fs: ((this: S, _: any) => any)[]): any {
    return mk_seq.apply(this, fs).call(this, _);
}

export function flat_map<Arg, Res>(fn: (arg: Arg, idx: number) => Res | Res[]): (list: (Arg | Arg[])[]) => Res[] {
    return (list: (Arg | Arg[])[]) => {
        const res: Res[] = [];
        let n = 0;
        for (let i = 0; i < list.length; i++) op(list[i]);
        return res;

        function op(item: Arg | Arg[]) {
            if (Array.isArray(item)) {
                for (const sub of item) op(sub);
            } else {
                const val = fn(item, n++);
                if (Array.isArray(val)) {
                    for (const elm of val) {
                        res.push(elm);
                    }
                } else {
                    res.push(val);
                }
            }
        }
    };
}

export const flat_list: <Type>(list: (Type | Type[])[]) => Type[] = flat_map(identity);

export function flat_all<Type>(...args: (Type | Type[])[]): Type[] {
    return flat_list(args);
}

export function any_to_str<Value>(value: Value): string {
    return `${value}`;
}

export function err_to_str(error: Error): string {
    return error.message;
}

export function str_to_err(message: string): Error {
    return new Error(message);
}
