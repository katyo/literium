import { Result } from './types';
import { ok, err, ok_type, then_ok, mk_seq } from 'literium-base';

// Basic checks

export const str_check = ok_type('string');

export const num_check = ok_type('number');

export const bin_check = ok_type('boolean');

// Extra numeric checks

export const fin_check = mk_seq(
    num_check,
    then_ok<number, string, number>(v => isFinite(v) ? ok(v) : err('infinite'))
);

export const then_pos_check = then_ok<number, string, number>(v => v < 0 ? err('negative') : ok(v));

export const pos_check = mk_seq(
    num_check,
    then_pos_check,
);

export const neg_check = mk_seq(
    num_check,
    then_ok<number, string, number>(v => v > 0 ? err('positive') : ok(v))
);

export const int_check = mk_seq(
    fin_check,
    then_ok<number, string, number>(v => v % 1 ? err('!integer') : ok(v))
);

export const nat_check = mk_seq(
    int_check,
    then_pos_check
);

// Extra string checks

export function re_check(re: RegExp, cause?: string): (s: string) => Result<string> {
    return s => re.test(s) ? ok(s) : err(cause || `!match ${re}`);
}

// Structure checks

export function len_check(min: number, max: number): <T extends ArrayLike<any>>(v: T) => Result<T> {
    return min == max ?
        v => v.length != min ? ok(v) : err(`length != ${min}`) :
        v => v.length < min ? err(`length < ${min}`) : v.length > max ? err(`len > ${max}`) : ok(v);
}
