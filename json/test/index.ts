import { deepStrictEqual as dse } from 'assert';
import { ok, err } from '@literium/base';
import { str, num, bin, und, fin, pos, neg, int, nat, list, dict, rec, mix, tup, alt, opt, def, val, map, then, parse, build, Type, date_msec, date_unix, regex } from '../src/index';

// custom type

// Our enum type
export const enum Order { Asc, Desc }

// The implementation of TypeApi
export const ord: Type<Order> = {
    // The parser function
    p(v) {
        const s = str.p(v);
        return !s.$ ? err(s._) : s._ == 'asc' ? ok(Order.Asc) : s._ == 'desc' ? ok(Order.Desc) : err("!'asc' & !'desc'");
    },
    // The builder function
    b(v) {
        return v === Order.Asc ? ok('asc') : v === Order.Desc ? ok('desc') : err("!Order");
    },
};

// custom combinator

export interface Pair<Key, Value> { $: Key, _: Value }

export function pair<Key, Value>(tk: Type<Key>, tv: Type<Value>): Type<Pair<Key, Value>> {
    return {
        p(x) {
            if (typeof x != 'object' ||
                Array.isArray(x) ||
                x == null) return err('!pair');
            const k = tk.p(x.$);
            if (!k.$) return err(`#key ${k._}`);
            const v = tv.p(x._);
            if (!v.$) return err(`#value ${v._}`);
            return ok({ $: k._, _: v._ });
        },
        b(x) {
            if (typeof x != 'object' ||
                Array.isArray(x) ||
                x == null) return err('!pair');
            const k = tk.b(x.$);
            if (!k.$) return err(`#key ${k._}`);
            const v = tv.b(x._);
            if (!v.$) return err(`#value ${v._}`);
            return ok({ $: k._, _: v._ });
        }
    };
}

// mapping

const start_from_one = map(
    (v: number) => v + 1,
    (v: number) => v - 1
);
const idx = start_from_one(int);

const validate_even = then(
    (v: number) => v % 2 ? err('odd') : ok(v),
    (v: number) => v % 2 ? err('odd') : ok(v),
);
const even = validate_even(int);

describe('json', () => {
    describe('parse', () => {
        describe('atomics', () => {
            describe('basic', () => {
                it('str', () => {
                    dse(parse(str)(`"abc"`), ok("abc"));
                    dse(parse(str)(`123`), err("!string"));
                    dse(parse(str)(`null`), err("!string"));
                });

                it('num', () => {
                    dse(parse(num)(`123`), ok(123));
                    dse(parse(num)(`0`), ok(0));
                    dse(parse(num)(`123.456`), ok(123.456));
                    dse(parse(num)(`-123.456`), ok(-123.456));
                    dse(parse(num)(`"abc"`), err("!number"));
                    dse(parse(num)(`null`), err("!number"));
                });

                it('bin', () => {
                    dse(parse(bin)(`true`), ok(true));
                    dse(parse(bin)(`false`), ok(false));
                    dse(parse(bin)(`"abc"`), err("!boolean"));
                    dse(parse(bin)(`null`), err("!boolean"));
                });

                it('und', () => {
                    dse(parse(und)(`null`), ok(undefined));
                    dse(parse(und)(`"abc"`), err("defined"));
                    dse(parse(und)(`123`), err("defined"));
                });
            });

            describe('numeric', () => {
                it('fin', () => {
                    dse(parse(fin)(`123`), ok(123));
                    dse(parse(fin)(`-123`), ok(-123));
                    dse(parse(fin)(`0`), ok(0));
                    dse(parse(fin)(`123.456`), ok(123.456));
                    dse(parse(fin)(`-123.456`), ok(-123.456));
                    dse(parse(fin)(`"abc"`), err("!number"));
                    dse(parse(fin)(`null`), err("!number"));
                });

                it('pos', () => {
                    dse(parse(pos)(`123`), ok(123));
                    dse(parse(pos)(`-123`), err("negative"));
                    dse(parse(pos)(`0`), ok(0));
                    dse(parse(pos)(`123.456`), ok(123.456));
                    dse(parse(pos)(`-123.456`), err("negative"));
                    dse(parse(pos)(`"abc"`), err("!number"));
                    dse(parse(pos)(`null`), err("!number"));
                });

                it('neg', () => {
                    dse(parse(neg)(`123`), err("positive"));
                    dse(parse(neg)(`-123`), ok(-123));
                    dse(parse(neg)(`0`), ok(0));
                    dse(parse(neg)(`123.456`), err("positive"));
                    dse(parse(neg)(`-123.456`), ok(-123.456));
                    dse(parse(neg)(`"abc"`), err("!number"));
                    dse(parse(neg)(`null`), err("!number"));
                });

                it('int', () => {
                    dse(parse(int)(`123`), ok(123));
                    dse(parse(int)(`-123`), ok(-123));
                    dse(parse(int)(`0`), ok(0));
                    dse(parse(int)(`123.456`), err("!integer"));
                    dse(parse(int)(`-123.456`), err("!integer"));
                    dse(parse(int)(`"abc"`), err("!number"));
                    dse(parse(int)(`null`), err("!number"));
                });

                it('nat', () => {
                    dse(parse(nat)(`123`), ok(123));
                    dse(parse(nat)(`-123`), err("negative"));
                    dse(parse(nat)(`0`), ok(0));
                    dse(parse(nat)(`123.456`), err("!integer"));
                    dse(parse(nat)(`-123.456`), err("!integer"));
                    dse(parse(nat)(`"abc"`), err("!number"));
                    dse(parse(nat)(`null`), err("!number"));
                });
            });

            describe('date', () => {
                it('msec', () => {
                    dse(parse(date_msec)(`1531376419000`), ok(new Date(1531376419000)));
                    dse(parse(date_msec)(`"abc"`), err("!number"));
                    dse(parse(date_msec)(`123.456`), err("!integer"));
                    dse(parse(date_msec)(`-123`), err("negative"));
                });

                it('unix', () => {
                    dse(parse(date_unix)(`1531376419`), ok(new Date(1531376419000)));
                    dse(parse(date_unix)(`"abc"`), err("!number"));
                    dse(parse(date_unix)(`123.456`), err("!integer"));
                    dse(parse(date_unix)(`-123`), err("negative"));
                });
            });

            describe('custom', () => {
                it('order', () => {
                    dse(parse(ord)(`"asc"`), ok(Order.Asc));
                    dse(parse(ord)(`"desc"`), ok(Order.Desc));
                    dse(parse(ord)(`"abc"`), err("!'asc' & !'desc'"));
                    dse(parse(ord)(`123`), err("!string"));
                });
            });
        });

        describe('continers', () => {
            describe('list', () => {
                it('empty', () => {
                    const t = list(str);
                    dse(parse(t)(`[]`), ok([]));
                    dse(parse(t)(`{}`), err("!array"));
                });

                it('single', () => {
                    const t = list(str);
                    dse(parse(t)(`["abc"]`), ok(["abc"]));
                    dse(parse(t)(`{"abc":"abc"}`), err("!array"));
                    dse(parse(t)(`[123]`), err("[0] !string"));
                });

                it('multi', () => {
                    const t = list(str);
                    dse(parse(t)(`["abc", "def"]`), ok(["abc", "def"]));
                    dse(parse(t)(`{"abc":"abc","def":"def"}`), err("!array"));
                    dse(parse(t)(`["abc","def",123]`), err("[2] !string"));
                });
            });

            describe('dict', () => {
                it('empty', () => {
                    const t = dict({});
                    dse(parse(t)(`{}`), ok({}));
                    dse(parse(t)(`[]`), err("!object"));
                    dse(parse(t)(`null`), err("!object"));
                    dse(parse(t)(`{"abc":123}`), ok({}));
                });

                it('single', () => {
                    const t = dict({ a: str });
                    dse(parse(t)(`{"a":"abc"}`), ok({ a: "abc" }));
                    dse(parse(t)(`{"a":123}`), err(".a !string"));
                    dse(parse(t)(`{}`), err(".a missing"));
                });

                it('multi', () => {
                    const t = dict({ a: str, b: fin });
                    dse(parse(t)(`{"a":"abc","b":123}`), ok({ a: "abc", b: 123 }));
                    dse(parse(t)(`{"a":"abc"}`), err(".b missing"));
                    dse(parse(t)(`{"a":"abc","b":null}`), err(".b !number"));
                });

                it('nested', () => {
                    const t = dict({ a: str, b: dict({ a: nat }) });
                    dse(parse(t)(`{"a":"abc","b":{"a":123}}`), ok({ a: "abc", b: { a: 123 } }));
                    dse(parse(t)(`{"a":"abc","b":{}}`), err(".b .a missing"));
                    dse(parse(t)(`{"a":"abc","b":{"a":-1}}`), err(".b .a negative"));
                });
            });

            describe('rec', () => {
                it('empty', () => {
                    const t = rec(str);
                    dse(parse(t)(`{}`), ok({}));
                    dse(parse(t)(`[]`), err("!object"));
                    dse(parse(t)(`null`), err("!object"));
                });

                it('single', () => {
                    const t = rec(str);
                    dse(parse(t)(`{"abc":"def"}`), ok({abc:"def"}));
                    dse(parse(t)(`{"abc":123}`), err(".abc value !string"));
                });

                it('multi', () => {
                    const t = rec(str);
                    dse(parse(t)(`{"abc":"def","123":"abc"}`), ok({abc:"def",123:"abc"}));
                    dse(parse(t)(`{"123":"def","abc":123}`), err(".abc value !string"));
                });

                it('alt', () => {
                    const t = rec(alt(str, num));
                    dse(parse(t)(`{"abc":"def","123":"abc"}`), ok({abc:"def",123:"abc"}));
                    dse(parse(t)(`{"123":"def","abc":123}`), ok({123:"def",abc:123}));
                });

                it('key', () => {
                    const t = rec(num, map(k => `~${k}`, k => k)(str));
                    dse(parse(t)(`{"abc":456,"123":0}`), ok({"~abc":456,"~123":0}));

                    const e = rec(num, then(k => parseInt(k) ? ok(k) : err("error"), (k: string) => ok(k))(str));
                    dse(parse(e)(`{"123":0,"abc":456}`), err(`.abc key error`));
                });
            });

            describe('mix', () => {
                it('single', () => {
                    const t = mix(dict({ a: str }));
                    dse(parse(t)(`{"a":"abc"}`), ok({ a: "abc" }));
                    dse(parse(t)(`{"a":123}`), err(".a !string"));
                    dse(parse(t)(`{}`), err(".a missing"));
                });

                it('multi', () => {
                    const t = mix(dict({ a: str }), dict({ b: fin }));
                    dse(parse(t)(`{"a":"abc","b":123}`), ok({ a: "abc", b: 123 }));
                    dse(parse(t)(`{"a":"abc"}`), err(".b missing"));
                    dse(parse(t)(`{"a":"abc","b":null}`), err(".b !number"));
                });
            });

            describe('tup', () => {
                it('dual', () => {
                    const t = tup(str, num);
                    dse(parse(t)(`["abc",123]`), ok(["abc", 123]));
                    dse(parse(t)(`[123,"abc"]`), err("[0] !string"));
                    dse(parse(t)(`["abc",true]`), err("[1] !number"));
                    dse(parse(t)(`["abc"]`), err("insufficient"));
                    dse(parse(t)(`["abc",123,true]`), err("exceeded"));
                });
            });

            describe('custom', () => {
                it('pair', () => {
                    const snp = pair(str, num);
                    dse(parse(snp)(`{"$":"abc","_":123}`), ok({ $: "abc", _: 123 }));
                    dse(parse(snp)(`["abc",123]`), err("!pair"));
                    dse(parse(snp)(`null`), err("!pair"));
                    dse(parse(snp)(`{"_":123}`), err("#key !string"));
                    dse(parse(snp)(`{"$":123}`), err("#key !string"));
                    dse(parse(snp)(`{"$":"abc","_":true}`), err("#value !number"));
                });
            });
        });

        describe('modifiers', () => {
            describe('regex', () => {
                it('basic', () => {
                    const s = regex(/^a+bc?$/, '!match')(str);
                    dse(parse(s)(`"abc"`), ok("abc"));
                    dse(parse(s)(`"aab"`), ok("aab"));
                    dse(parse(s)(`"aabc"`), ok("aabc"));
                    dse(parse(s)(`"aac"`), err('!match'));
                    dse(parse(s)(`123`), err("!string"));
                    dse(parse(s)(`null`), err("!string"));
                });
            });

            describe('alt', () => {
                it('dual', () => {
                    const t = alt(str, num);
                    dse(parse(t)(`"abc"`), ok("abc"));
                    dse(parse(t)(`123`), ok(123));
                    dse(parse(t)(`true`), err("!string & !number"));
                    dse(parse(t)(`null`), err("!string & !number"));
                    dse(parse(t)(`[]`), err("!string & !number"));
                });

                it('triple', () => {
                    const t = alt(str, num, bin);
                    dse(parse(t)(`"abc"`), ok("abc"));
                    dse(parse(t)(`123`), ok(123));
                    dse(parse(t)(`true`), ok(true));
                    dse(parse(t)(`null`), err("!string & !number & !boolean"));
                    dse(parse(t)(`[]`), err("!string & !number & !boolean"));
                });
            });

            describe('opt', () => {
                it('atomic', () => {
                    const t = opt(str);
                    dse(parse(t)(`"abc"`), ok("abc"));
                    dse(parse(t)(`null`), ok(undefined));
                    dse(parse(t)(`123`), err("!string & defined"));
                    dse(parse(t)(`{}`), err("!string & defined"));
                });

                it('nested', () => {
                    const t = dict({ a: opt(str) });
                    dse(parse(t)(`{"a":"abc"}`), ok({ a: "abc" }));
                    dse(parse(t)(`{}`), ok({}));
                    dse(parse(t)(`{"a":null}`), ok({}));
                    dse(parse(t)(`{"a":123}`), err(".a !string & defined"));
                    dse(parse(t)(`{"a":[]}`), err(".a !string & defined"));
                });
            });

            it('def', () => {
                const t = def("def")(str);
                dse(parse(t)(`"abc"`), ok("abc"));
                dse(parse(t)(`"def"`), ok("def"));
                dse(parse(t)(`null`), ok("def"));
                dse(parse(t)(`123`), err("!string & defined"));
            });

            it('val', () => {
                const t = val(123);
                dse(parse(t)(`123`), ok(123));
                dse(parse(t)(`null`), ok(123));
            });

            it('map', () => {
                dse(parse(idx)(`0`), ok(1));
                dse(parse(idx)(`9`), ok(10));
            });

            it('then', () => {
                dse(parse(even)(`0`), ok(0));
                dse(parse(even)(`1`), err("odd"));
                dse(parse(even)(`2`), ok(2));
                dse(parse(even)(`99`), err("odd"));
                dse(parse(even)(`100`), ok(100));
            });
        });
    });

    describe('build', () => {
        describe('atomics', () => {
            describe('basic', () => {
                it('str', () => {
                    dse(build(str)("abc"), ok(`"abc"`));
                    dse(build(str)(123 as any), err("!string"));
                    dse(build(str)(null as any), err("!string"));
                });

                it('num', () => {
                    dse(build(num)(123), ok(`123`));
                    dse(build(num)(0), ok(`0`));
                    dse(build(num)(123.456), ok(`123.456`));
                    dse(build(num)(-123.456), ok(`-123.456`));
                    dse(build(num)(Infinity), ok(`null`));
                    dse(build(num)(-Infinity), ok(`null`));
                    dse(build(num)(NaN), ok(`null`));
                    dse(build(num)("abc" as any), err("!number"));
                    dse(build(num)(null as any), err("!number"));
                });

                it('bin', () => {
                    dse(build(bin)(true), ok(`true`));
                    dse(build(bin)(false), ok(`false`));
                    dse(build(bin)("abc" as any), err("!boolean"));
                    dse(build(bin)(null as any), err("!boolean"));
                });

                it('und', () => {
                    dse(build(und)(undefined), ok(`null`));
                    dse(build(und)(null as any), ok(`null`));
                    dse(build(und)("abc" as any), err("defined"));
                    dse(build(und)(123 as any), err("defined"));
                });
            });

            describe('numeric', () => {
                it('fin', () => {
                    dse(build(fin)(123), ok(`123`));
                    dse(build(fin)(-123), ok(`-123`));
                    dse(build(fin)(0), ok(`0`));
                    dse(build(fin)(123.456), ok(`123.456`));
                    dse(build(fin)(-123.456), ok(`-123.456`));
                    dse(build(fin)(Infinity), err("infinite"));
                    dse(build(fin)(-Infinity), err("infinite"));
                    dse(build(fin)(NaN), err("infinite"));
                    dse(build(fin)("abc" as any), err("!number"));
                    dse(build(fin)(null as any), err("!number"));
                });

                it('pos', () => {
                    dse(build(pos)(123), ok(`123`));
                    dse(build(pos)(-123), err("negative"));
                    dse(build(pos)(0), ok(`0`));
                    dse(build(pos)(123.456), ok(`123.456`));
                    dse(build(pos)(-123.456), err("negative"));
                    dse(build(pos)("abc" as any), err("!number"));
                    dse(build(pos)(null as any), err("!number"));
                });

                it('neg', () => {
                    dse(build(neg)(123), err("positive"));
                    dse(build(neg)(-123), ok(`-123`));
                    dse(build(neg)(0), ok(`0`));
                    dse(build(neg)(123.456), err("positive"));
                    dse(build(neg)(-123.456), ok(`-123.456`));
                    dse(build(neg)("abc" as any), err("!number"));
                    dse(build(neg)(null as any), err("!number"));
                });

                it('int', () => {
                    dse(build(int)(123), ok(`123`));
                    dse(build(int)(-123), ok(`-123`));
                    dse(build(int)(0), ok(`0`));
                    dse(build(int)(123.456), err("!integer"));
                    dse(build(int)(-123.456), err("!integer"));
                    dse(build(int)("abc" as any), err("!number"));
                    dse(build(int)(undefined as any), err("!number"));
                });

                it('nat', () => {
                    dse(build(nat)(123), ok(`123`));
                    dse(build(nat)(-123), err("negative"));
                    dse(build(nat)(0), ok(`0`));
                    dse(build(nat)(123.456), err("!integer"));
                    dse(build(nat)(-123.456), err("!integer"));
                    dse(build(nat)("abc" as any), err("!number"));
                    dse(build(nat)(null as any), err("!number"));
                });
            });

            describe('date', () => {
                it('msec', () => {
                    dse(build(date_msec)(new Date(1531376419000)), ok(`1531376419000`));
                    dse(build(date_msec)(123 as any), err("!date"));
                    dse(build(date_msec)(new Array() as any), err("!date"));
                    dse(build(date_msec)("abc" as any), err("!date"));
                });

                it('unix', () => {
                    dse(build(date_unix)(new Date(1531376419000)), ok(`1531376419`));
                    dse(build(date_unix)(123 as any), err("!date"));
                    dse(build(date_unix)(new Array() as any), err("!date"));
                    dse(build(date_unix)("abc" as any), err("!date"));
                });
            });

            describe('custom', () => {
                it('order', () => {
                    dse(build(ord)(Order.Asc), ok(`"asc"`));
                    dse(build(ord)(Order.Desc), ok(`"desc"`));
                    dse(build(ord)(123), err("!Order"));
                    dse(build(ord)("abc" as any), err("!Order"));
                });
            });
        });

        describe('containers', () => {
            describe('list', () => {
                it('empty', () => {
                    dse(build(list(str))([]), ok(`[]`));
                    dse(build(list(str))({} as any), err("!array"));
                });

                it('single', () => {
                    dse(build(list(str))(["abc"]), ok(`["abc"]`));
                    dse(build(list(str))({ abc: "abc" } as any), err("!array"));
                    dse(build(list(str))([123] as any), err("[0] !string"));
                });

                it('multi', () => {
                    dse(build(list(str))(["abc", "def"]), ok(`["abc","def"]`));
                    dse(build(list(str))({ "abc": "abc", "def": "def" } as any), err("!array"));
                    dse(build(list(str))(["abc", "def", 123] as any), err("[2] !string"));
                });
            });

            describe('dict', () => {
                it('empty', () => {
                    const t = dict({});
                    dse(build(t)({}), ok(`{}`));
                    dse(build(t)([]), err("!object"));
                    dse(build(t)({ "abc": 123 }), ok(`{}`));
                    dse(build(dict({ a: str }))({} as any), err(".a missing"));
                });

                it('single', () => {
                    const t = dict({ a: str });
                    dse(build(t)({ a: "abc" }), ok(`{"a":"abc"}`));
                    dse(build(t)({ a: 123 } as any), err(".a !string"));
                });

                it('multi', () => {
                    const t = dict({ a: str, b: fin });
                    dse(build(t)({ a: "abc", b: 123 }), ok(`{"a":"abc","b":123}`));
                    dse(build(t)({ a: "abc" } as any), err(".b missing"));
                    dse(build(t)({ a: "abc", b: undefined } as any), err(".b !number"));
                });

                it('nested', () => {
                    const t = dict({ a: str, b: dict({ a: nat }) });
                    dse(build(t)({ a: "abc", b: { a: 123 } }), ok(`{"a":"abc","b":{"a":123}}`));
                    dse(build(t)({ a: "abc", b: {} } as any), err(".b .a missing"));
                    dse(build(t)({ a: "abc", b: { a: -1 } }), err(".b .a negative"));
                });
            });

            describe('rec', () => {
                it('empty', () => {
                    const t = rec(str);
                    dse(build(t)({}), ok(`{}`));
                    dse(build(t)([] as any), err("!object"));
                    
                });

                it('single', () => {
                    const t = rec(str);
                    dse(build(t)({ "abc": "123" }), ok(`{"abc":"123"}`));
                    dse(build(t)({ "abc": 123 } as any), err(`.abc value !string`));
                });

                it('multi', () => {
                    const t = rec(str);
                    dse(build(t)({ "abc": "123", "def": "abc" }), ok(`{"abc":"123","def":"abc"}`));
                    dse(build(t)({ "def": "abc", "abc": 123 } as any), err(`.abc value !string`));
                });

                it('alt', () => {
                    const t = rec(alt(str, num));
                    dse(build(t)({ "abc": "123", "def": "abc" }), ok(`{"abc":"123","def":"abc"}`));
                    dse(build(t)({ "def": "abc", "abc": 123 } as any), ok(`{"def":"abc","abc":123}`));
                });

                it('key', () => {
                    const t = rec(num, map((k: string) => k, k => `~${k}`)(str));
                    dse(build(t)({"123":0,"abc":456}), ok(`{"~123":0,"~abc":456}`));

                    const e = rec(num, then((k: string) => ok(k), k => parseInt(k) ? ok(k) : err("error"))(str));
                    dse(build(e)({"123":0,"abc":456}), err(`.abc key error`));
                });
            });

            describe('mix', () => {
                it('single', () => {
                    const t = mix(dict({ a: str }));
                    dse(build(t)({ a: "abc" }), ok(`{"a":"abc"}`));
                    dse(build(t)([] as any), err("!object"));
                    dse(build(t)({ a: 123 } as any), err(".a !string"));
                });

                it('multi', () => {
                    const t = mix(dict({ a: str }), dict({ b: fin }));
                    dse(build(t)({ a: "abc", b: 123 }), ok(`{"a":"abc","b":123}`));
                    dse(build(t)({ a: "abc" } as any), err(".b missing"));
                    dse(build(t)({ a: "abc", b: undefined } as any), err(".b !number"));
                });
            });

            describe('tup', () => {
                it('dual', () => {
                    const t = tup(str, num);
                    dse(build(t)(["abc", 123]), ok(`["abc",123]`));
                    dse(build(t)([123, "abc"] as any), err("[0] !string"));
                    dse(build(t)(["abc", true] as any), err("[1] !number"));
                    dse(build(t)(["abc"] as any), err("insufficient"));
                    dse(build(t)(["abc", 123, true] as any), err("exceeded"));
                });
            });

            describe('custom', () => {
                it('pair', () => {
                    const snp = pair(str, num);
                    dse(build(snp)({ $: "abc", _: 123 }), ok(`{"$":"abc","_":123}`));
                    dse(build(snp)(["abc", 123] as any), err("!pair"));
                    dse(build(snp)(null as any), err("!pair"));
                    dse(build(snp)({ _: 123 } as any), err("#key !string"));
                    dse(build(snp)({ $: 123 } as any), err("#key !string"));
                    dse(build(snp)({ $: "abc", _: true } as any), err("#value !number"));
                });
            });
        });

        describe('modifiers', () => {
            describe('regex', () => {
                it('basic', () => {
                    const s = regex(/^a+bc?$/, '!match')(str);
                    dse(build(s)("abc"), ok(`"abc"`));
                    dse(build(s)("aab"), ok(`"aab"`));
                    dse(build(s)("aabc"), ok(`"aabc"`));
                    dse(build(s)("aac"), err('!match'));
                    dse(build(s)(123 as any), err("!string"));
                    dse(build(s)(null as any), err("!string"));
                });
            });

            describe('alt', () => {
                it('dual', () => {
                    const t = alt(str, num);
                    dse(build(t)("abc"), ok(`"abc"`));
                    dse(build(t)(123), ok(`123`));
                    dse(build(t)(true as any), err("!string & !number"));
                    dse(build(t)(undefined as any), err("!string & !number"));
                    dse(build(t)([] as any), err("!string & !number"));
                });

                it('triple', () => {
                    const t = alt(str, num, bin);
                    dse(build(t)("abc"), ok(`"abc"`));
                    dse(build(t)(123), ok(`123`));
                    dse(build(t)(true), ok(`true`));
                    dse(build(t)(undefined as any), err("!string & !number & !boolean"));
                    dse(build(t)([] as any), err("!string & !number & !boolean"));
                });
            });

            describe('opt', () => {
                it('atomic', () => {
                    const t = opt(str);
                    dse(build(t)("abc"), ok(`"abc"`));
                    dse(build(t)(undefined), ok(`null`));
                    dse(build(t)(123 as any), err("!string & defined"));
                    dse(build(t)({} as any), err("!string & defined"));
                });

                it('nested', () => {
                    const t = dict({ a: opt(str) });
                    dse(build(t)({ a: "abc" }), ok(`{"a":"abc"}`));
                    dse(build(t)({} as any), ok(`{}`));
                    dse(build(t)({ "a": undefined }), ok(`{}`));
                    dse(build(t)({ "a": 123 } as any), err(".a !string & defined"));
                    dse(build(t)({ "a": [] } as any), err(".a !string & defined"));
                });
            });

            it('def', () => {
                const t = def("def")(str);
                dse(build(t)("abc"), ok(`"abc"`));
                dse(build(t)("def"), ok(`null`));
                dse(build(t)(null as any), err("!string"));
                dse(build(t)(123 as any), err("!string"));
            });

            it('val', () => {
                const t = val(123);
                dse(build(t)(123), ok(`null`));
                dse(build(t)(undefined as any), ok(`null`));
            });

            it('map', () => {
                dse(build(idx)(1), ok(`0`));
                dse(build(idx)(10), ok(`9`));
            });

            it('then', () => {
                dse(build(even)(0), ok(`0`));
                dse(build(even)(1), err("odd"));
                dse(build(even)(2), ok(`2`));
                dse(build(even)(99), err("odd"));
                dse(build(even)(100), ok(`100`));
            });
        });
    });
});
