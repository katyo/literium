export function identity<Value>(_: Value): Value { return _; }

export function dummy(): void { }

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
