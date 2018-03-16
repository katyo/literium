import { BaseTypes, NumTypes, PathArg, baseTypes, numTypes, TypeApi, Route } from '../src/router';

export const enum Order { Asc, Desc }
export interface OrderType {
    ord: Order;
}

export const orderType: TypeApi<OrderType> = {
    ord: {
        match: path => {
            const m = path.match(/^(asc|desc)(.*)$/);
            if (m) return [m[1] == 'asc' ? Order.Asc : Order.Desc, m[2]];
        },
        build: arg => `${arg == Order.Asc ? 'asc' : 'desc'}`
    },
};

export const root: Route<BaseTypes & NumTypes, PathArg<BaseTypes & NumTypes>> = Route.new(baseTypes).extra(numTypes).route('/');
export const blog = root.route('blog');

export const post_by_id = blog.route('/').route({ id: 'nat' });
export const blog_by_tag = blog.route('/tag-').route({ tag: 'str' });

export const blog_sort_by_date = blog.route('/date-').extra(orderType).route({ sort: 'ord' });
export const blog_by_tag_and_sort_by_date = blog_by_tag.route('/date-').extra(orderType).route({ sort: 'ord' });
