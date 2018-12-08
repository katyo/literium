import { Result } from './types';
import { JSType, type_name, ok, err, ok_type, then_ok, map_err, mk_seq } from '@literium/base';

// Basic checks

function type_check<T extends JSType>(t: T) {
    return mk_seq(ok_type(t), map_err((t: JSType) => '!' + type_name(t)));
}

export const str_check = /*@__PURE__*/type_check(JSType.String);

export const num_check = /*@__PURE__*/type_check(JSType.Number);

export const bin_check = /*@__PURE__*/type_check(JSType.Boolean);

// Extra numeric checks

export const fin_check = /*@__PURE__*/mk_seq(
    num_check,
    then_ok<number, string, number>(v => isFinite(v) ? ok(v) : err('infinite'))
);

export const then_pos_check = /*@__PURE__*/then_ok<number, string, number>(v => v < 0 ? err('negative') : ok(v));

export const pos_check = /*@__PURE__*/mk_seq(
    num_check,
    then_pos_check,
);

export const neg_check = /*@__PURE__*/mk_seq(
    num_check,
    then_ok<number, string, number>(v => v > 0 ? err('positive') : ok(v))
);

export const int_check = /*@__PURE__*/mk_seq(
    fin_check,
    then_ok<number, string, number>(v => v % 1 ? err('!integer') : ok(v))
);

export const nat_check = /*@__PURE__*/mk_seq(
    int_check,
    then_pos_check
);

// Extra string checks

export function re_check(re: RegExp, cause?: string): (s: string) => Result<string> {
    return s => typeof s != 'string' ? err('!string') : re.test(s) ? ok(s) : err(cause || '!match');
}

// Structure checks

export function len_check(min: number, max: number): <T extends ArrayLike<any>>(v: T) => Result<T> {
    return min == max ?
        v => v.length != min ? ok(v) : err(`length != ${min}`) :
        v => v.length < min ? err(`length < ${min}`) : v.length > max ? err(`len > ${max}`) : ok(v);
}
