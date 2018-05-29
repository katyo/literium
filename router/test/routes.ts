import { Route, dir, arg, query, alt, seq, str, nat } from '../src/router';
export { Route };

export const enum Order { Asc, Desc }

export const ord: Route<Order> = {
    p: path => {
        const m = path.match(/^(asc|desc)(.*)$/);
        if (m) return [m[1] == 'asc' ? Order.Asc : Order.Desc, m[2]];
    },
    b: arg => arg == Order.Asc || arg == Order.Desc ?
        `${arg == Order.Asc ? 'asc' : 'desc'}` : undefined
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

const blog_search = seq(blog, dir('/search'), query({ phrase: str }));

export const routes = {
    root,
    post_by_id,
    blog_by_tag,
    blog_sort_by_date,
    blog_by_tag_and_sort_by_date,
    blog_by_tag_or_sort_by_date,
    blog_by_tag_and_opt_sort_by_date,
    blog_list,
    blog_search,
};
