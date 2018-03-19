import { baseTypes, numTypes, TypeApi, Route, route_str, route_arg, route_or, route_and } from '../src/router';
export { Route };

export const enum Order { Asc, Desc }
export interface OrderType {
    ord: Order;
}

export const orderType: TypeApi<OrderType> = {
    ord: {
        parse: path => {
            const m = path.match(/^(asc|desc)(.*)$/);
            if (m) return [m[1] == 'asc' ? Order.Asc : Order.Desc, m[2]];
        },
        build: arg => arg == Order.Asc || arg == Order.Desc ?
            `${arg == Order.Asc ? 'asc' : 'desc'}` : undefined
    },
};

const root = route_str('/');
const blog = route_and(root, route_str('blog'));

const post_by_id = route_and(blog, route_str('/'), route_arg({ id: 'nat' }, numTypes));
const blog_by_tag = route_and(blog, route_str('/tag-'), route_arg({ tag: 'str' }, baseTypes));

const blog_sort_by_date = route_and(blog, route_str('/date-'), route_arg({ sort: 'ord' }, orderType));
const blog_by_tag_and_sort_by_date = route_and(blog_by_tag, route_str('/date-'), route_arg({ sort: 'ord' }, orderType));

const blog_by_tag_or_sort_by_date = route_or(blog_by_tag, blog_sort_by_date);

const blog_by_tag_and_opt_sort_by_date = route_or(blog_by_tag_and_sort_by_date, blog_by_tag);

export const routes = {
    root,
    post_by_id,
    blog_by_tag,
    blog_sort_by_date,
    blog_by_tag_and_sort_by_date,
    blog_by_tag_or_sort_by_date,
    blog_by_tag_and_opt_sort_by_date,
};
