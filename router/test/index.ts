import { deepEqual } from 'assert';
import { route_match, route_build } from '../src/router';
import { Order, routes } from './routes';

const {
    root,
    post_by_id,
    blog_by_tag,
    blog_sort_by_date,
    blog_by_tag_and_sort_by_date,
    blog_by_tag_or_sort_by_date,
    blog_by_tag_and_opt_sort_by_date,
} = routes;

describe('route', () => {
    describe('match', () => {
        describe('root', () => {
            it('pass', () => {
                deepEqual(route_match(root, '/'), {});
            });
            it('fail', () => {
                deepEqual(route_match(root, '/other'), undefined);
                deepEqual(route_match(root, '/blog'), undefined);
            });
        });

        describe('single num arg', () => {
            it('pass', () => {
                deepEqual(route_match(post_by_id, '/blog/0'), { id: 0 });
                deepEqual(route_match(post_by_id, '/blog/1'), { id: 1 });
                deepEqual(route_match(post_by_id, '/blog/123'), { id: 123 });
            });
            it('fail', () => {
                deepEqual(route_match(post_by_id, '/blog/-1'), undefined);
                deepEqual(route_match(post_by_id, '/blog/tag'), undefined);
                deepEqual(route_match(post_by_id, '/node'), undefined);
                deepEqual(route_match(post_by_id, '/'), undefined);
            });
        });

        describe('single str arg', () => {
            it('pass', () => {
                deepEqual(route_match(blog_by_tag, '/blog/tag-123'), { tag: "123" });
                deepEqual(route_match(blog_by_tag, '/blog/tag-git'), { tag: "git" });
            });
            it('fail', () => {
                deepEqual(route_match(blog_by_tag, '/blog/1'), undefined);
                deepEqual(route_match(blog_by_tag, '/blog/tag'), undefined);
                deepEqual(route_match(blog_by_tag, '/node'), undefined);
                deepEqual(route_match(blog_by_tag, '/'), undefined);
            });
        });

        describe('single ord arg', () => {
            it('pass', () => {
                deepEqual(route_match(blog_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                deepEqual(route_match(blog_sort_by_date, '/blog/date-desc'), { sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(route_match(blog_sort_by_date, '/blog/date-abc'), undefined);
                deepEqual(route_match(blog_sort_by_date, '/blog/tag'), undefined);
                deepEqual(route_match(blog_sort_by_date, '/node'), undefined);
                deepEqual(route_match(blog_sort_by_date, '/'), undefined);
            });
        });

        describe('str and ord args', () => {
            it('pass', () => {
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/tag-123/date-asc'), { tag: "123", sort: Order.Asc });
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/tag-git/date-desc'), { tag: "git", sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/tag-car/date-abc'), undefined);
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/1'), undefined);
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/tag-123'), undefined);
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/blog/tag'), undefined);
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/node'), undefined);
                deepEqual(route_match(blog_by_tag_and_sort_by_date, '/'), undefined);
            });
        });

        describe('mix routes', () => {
            it('pass', () => {
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/tag-123'), { tag: "123" });
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                deepEqual(route_match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-es6'), { tag: "es6" });
                deepEqual(route_match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-desc'), { tag: "js", sort: Order.Desc });
            });

            it('fail', () => {
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/tag-123/date-abc'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/1'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/tag-'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/tag-js/'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/blog/tag'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/node'), undefined);
                deepEqual(route_match(blog_by_tag_or_sort_by_date, '/'), undefined);
                deepEqual(route_match(blog_by_tag_and_opt_sort_by_date, '/blog/date-asc'), undefined);
                deepEqual(route_match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-other'), undefined);
                deepEqual(route_match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-asc/'), undefined);
            });
        });
    });

    describe('build', () => {
        it('root', () => {
            deepEqual(route_build(root, {}), '/');
        });

        it('single num arg', () => {
            deepEqual(route_build(post_by_id, { id: 0 }), '/blog/0');
            deepEqual(route_build(post_by_id, { id: 1 }), '/blog/1');
            deepEqual(route_build(post_by_id, { id: 123 }), '/blog/123');
        });

        it('single str arg', () => {
            deepEqual(route_build(blog_by_tag, { tag: "123" }), '/blog/tag-123');
            deepEqual(route_build(blog_by_tag, { tag: "git" }), '/blog/tag-git');
        });

        it('single ord arg', () => {
            deepEqual(route_build(blog_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            deepEqual(route_build(blog_sort_by_date, { sort: Order.Desc }), '/blog/date-desc');
        });

        it('str and ord args', () => {
            deepEqual(route_build(blog_by_tag_and_sort_by_date, { tag: "123", sort: Order.Asc }), '/blog/tag-123/date-asc');
            deepEqual(route_build(blog_by_tag_and_sort_by_date, { tag: "git", sort: Order.Desc }), '/blog/tag-git/date-desc');
        });

        it('mix routes', () => {
            deepEqual(route_build(blog_by_tag_or_sort_by_date, { tag: "123" }), '/blog/tag-123');
            deepEqual(route_build(blog_by_tag_or_sort_by_date, { tag: "git", sort: Order.Asc }), '/blog/tag-git');
            deepEqual(route_build(blog_by_tag_or_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            deepEqual(route_build(blog_by_tag_and_opt_sort_by_date, { tag: "es6" }), '/blog/tag-es6');
            deepEqual(route_build(blog_by_tag_and_opt_sort_by_date, { tag: "js", sort: Order.Desc }), '/blog/tag-js/date-desc');
        });
    });
});
