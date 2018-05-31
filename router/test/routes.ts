import { some, none } from 'literium-base';
import { ArgType, dir, arg, query, alt, seq, str, nat, opt, def } from '../src/router';
export { Route } from '../src/router';

export const enum Order { Asc, Desc }

export const ord: ArgType<Order> = {
    r: /^asc|desc/,
    p: v => v == 'asc' ? some(Order.Asc) : v == 'desc' ? some(Order.Desc) : none(),
    b: v => v == Order.Asc || v == Order.Desc ?
        `${v == Order.Asc ? 'asc' : 'desc'}` : undefined
};

const root = dir('/');
const blog = seq(root, dir('blog'));

const post_by_id = seq(blog, dir('/'), arg({ id: nat }));
const blog_by_tag = seq(blog, dir('/tag-'), arg({ tag: str }));

const blog_sort_by_date = seq(blog, dir('/date-'), arg({ sort: ord }));
const blog_by_tag_and_sort_by_date = seq(blog_by_tag, dir('/date-'), arg({ sort: ord }));

const blog_by_tag_or_sort_by_date = alt(blog_by_tag, blog_sort_by_date);
const blog_by_tag_and_opt_sort_by_date = alt(blog_by_tag_and_sort_by_date, blog_by_tag);

const blog_list = seq(blog, alt(
    query({ offset: nat, count: nat }),
    query({ count: nat })
));
const blog_list_alt = seq(blog, query({ offset: opt(nat), count: def(nat, 10) }));

const blog_search = seq(blog, dir('/search'), query({ phrase: str }));

const author_by_id_or_name = seq(root, dir('author/'), arg({ author: alt(nat, str) }), dir('/info'));
const author_by_id_or_name_alt = seq(root, dir('author/'), alt(arg({ id: nat }), arg({ name: str })), dir('/info'));

export const routes = {
    root,
    post_by_id,
    blog_by_tag,
    blog_sort_by_date,
    blog_by_tag_and_sort_by_date,
    blog_by_tag_or_sort_by_date,
    blog_by_tag_and_opt_sort_by_date,
    blog_list,
    blog_list_alt,
    blog_search,
    author_by_id_or_name,
    author_by_id_or_name_alt,
};
