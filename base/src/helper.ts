export function identity<Value>(_: Value): Value { return _; }

export function dummy(): void { }

export function do_seq<S, T1, T2>(this: S, _: T1, f1: (this: S, _: T1) => T2): T2;
export function do_seq<S, T1, T2, T3>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3): T3;
export function do_seq<S, T1, T2, T3, T4>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4): T4;
export function do_seq<S, T1, T2, T3, T4, T5>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5): T5;
export function do_seq<S, T1, T2, T3, T4, T5, T6>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6): T6;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7): T7;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7, T8>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8): T8;
export function do_seq<S, T1, T2, T3, T4, T5, T6, T7, T8, T9>(this: S, _: T1, f1: (this: S, _: T1) => T2, f2: (this: S, _: T2) => T3, f3: (this: S, _: T3) => T4, f4: (this: S, _: T4) => T5, f5: (this: S, _: T5) => T6, f6: (this: S, _: T6) => T7, f7: (this: S, _: T7) => T8, f8: (this: S, _: T8) => T9): T9;
export function do_seq<S>(this: S, _: any, ...fs: ((this: S, _: any) => any)[]): any {
    for (const f of fs) {
        _ = f.call(this, _);
    }
    return _;
}

export function flat_map<Arg, Res>(list: Arg[], fn: (arg: Arg, idx: number) => Res | Res[]): Res[] {
    const res: Res[] = [];
    for (let i = 0; i < list.length; i++) {
        const val = fn(list[i], i);
        if (Array.isArray(val)) {
            for (const elm of val) {
                res.push(elm);
            }
        } else {
            res.push(val);
        }
    }
    return res;
}

export function flat_list<Type>(list: (Type | Type[])[]): Type[] {
    return flat_map(list, a => a);
}

export function flat_all<Type>(...args: (Type | Type[])[]): Type[] {
    return flat_map(args, a => a);
}
