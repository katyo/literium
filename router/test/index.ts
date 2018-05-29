import { deepEqual } from 'assert';
import { match, build } from '../src/router';
import { Order, routes } from './routes';

const {
    root,
    post_by_id,
    blog_by_tag,
    blog_sort_by_date,
    blog_by_tag_and_sort_by_date,
    blog_by_tag_or_sort_by_date,
    blog_by_tag_and_opt_sort_by_date,
    blog_list,
    blog_search,
} = routes;

describe('route', () => {
    describe('match', () => {
        describe('root', () => {
            it('pass', () => {
                deepEqual(match(root, '/'), {});
            });
            it('fail', () => {
                deepEqual(match(root, '/other'), undefined);
                deepEqual(match(root, '/blog'), undefined);
            });
        });

        describe('single num arg', () => {
            it('pass', () => {
                deepEqual(match(post_by_id, '/blog/0'), { id: 0 });
                deepEqual(match(post_by_id, '/blog/1'), { id: 1 });
                deepEqual(match(post_by_id, '/blog/123'), { id: 123 });
            });
            it('fail', () => {
                deepEqual(match(post_by_id, '/blog/-1'), undefined);
                deepEqual(match(post_by_id, '/blog/tag'), undefined);
                deepEqual(match(post_by_id, '/node'), undefined);
                deepEqual(match(post_by_id, '/'), undefined);
            });
        });

        describe('single str arg', () => {
            it('pass', () => {
                deepEqual(match(blog_by_tag, '/blog/tag-123'), { tag: "123" });
                deepEqual(match(blog_by_tag, '/blog/tag-git'), { tag: "git" });
            });
            it('fail', () => {
                deepEqual(match(blog_by_tag, '/blog/1'), undefined);
                deepEqual(match(blog_by_tag, '/blog/tag'), undefined);
                deepEqual(match(blog_by_tag, '/node'), undefined);
                deepEqual(match(blog_by_tag, '/'), undefined);
            });
        });

        describe('single ord arg', () => {
            it('pass', () => {
                deepEqual(match(blog_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                deepEqual(match(blog_sort_by_date, '/blog/date-desc'), { sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(match(blog_sort_by_date, '/blog/date-abc'), undefined);
                deepEqual(match(blog_sort_by_date, '/blog/tag'), undefined);
                deepEqual(match(blog_sort_by_date, '/node'), undefined);
                deepEqual(match(blog_sort_by_date, '/'), undefined);
            });
        });

        describe('str and ord args', () => {
            it('pass', () => {
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/tag-123/date-asc'), { tag: "123", sort: Order.Asc });
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/tag-git/date-desc'), { tag: "git", sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/tag-car/date-abc'), undefined);
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/1'), undefined);
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/tag-123'), undefined);
                deepEqual(match(blog_by_tag_and_sort_by_date, '/blog/tag'), undefined);
                deepEqual(match(blog_by_tag_and_sort_by_date, '/node'), undefined);
                deepEqual(match(blog_by_tag_and_sort_by_date, '/'), undefined);
            });
        });

        describe('query args', () => {
            it('pass', () => {
                deepEqual(match(blog_list, '/blog?offset=20&count=10'), { offset: 20, count: 10 });
                deepEqual(match(blog_list, '/blog?count=10&offset=20&other'), { offset: 20, count: 10 });
                deepEqual(match(blog_list, '/blog?count=5'), { count: 5 });
                deepEqual(match(blog_search, '/blog/search?phrase=3D%20modeling'), { phrase: '3D modeling' });
            });
            it('fail', () => {
                deepEqual(match(blog_list, '/blog'), undefined);
                deepEqual(match(blog_list, '/blog?'), undefined);
                deepEqual(match(blog_list, '/blog/?count=5'), undefined);
                deepEqual(match(blog_list, '/blog/?offset=20&count=10'), undefined);
                deepEqual(match(blog_search, '/blog/search'), undefined);
                deepEqual(match(blog_search, '/blog/search?phrase'), undefined);
            });
        });

        describe('mix routes', () => {
            it('pass', () => {
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/tag-123'), { tag: "123" });
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                deepEqual(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-es6'), { tag: "es6" });
                deepEqual(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-desc'), { tag: "js", sort: Order.Desc });
            });

            it('fail', () => {
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/tag-123/date-abc'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/1'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/tag-'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/tag-js/'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/blog/tag'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/node'), undefined);
                deepEqual(match(blog_by_tag_or_sort_by_date, '/'), undefined);
                deepEqual(match(blog_by_tag_and_opt_sort_by_date, '/blog/date-asc'), undefined);
                deepEqual(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-other'), undefined);
                deepEqual(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-asc/'), undefined);
            });
        });
    });

    describe('build', () => {
        it('root', () => {
            deepEqual(build(root, {}), '/');
        });

        it('single num arg', () => {
            deepEqual(build(post_by_id, { id: 0 }), '/blog/0');
            deepEqual(build(post_by_id, { id: 1 }), '/blog/1');
            deepEqual(build(post_by_id, { id: 123 }), '/blog/123');
        });

        it('single str arg', () => {
            deepEqual(build(blog_by_tag, { tag: "123" }), '/blog/tag-123');
            deepEqual(build(blog_by_tag, { tag: "git" }), '/blog/tag-git');
        });

        it('single ord arg', () => {
            deepEqual(build(blog_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            deepEqual(build(blog_sort_by_date, { sort: Order.Desc }), '/blog/date-desc');
        });

        it('str and ord args', () => {
            deepEqual(build(blog_by_tag_and_sort_by_date, { tag: "123", sort: Order.Asc }), '/blog/tag-123/date-asc');
            deepEqual(build(blog_by_tag_and_sort_by_date, { tag: "git", sort: Order.Desc }), '/blog/tag-git/date-desc');
        });

        it('query args', () => {
            deepEqual(build(blog_list, { offset: 20, count: 10 }), '/blog?offset=20&count=10');
            deepEqual(build(blog_list, { count: 10, offset: 20 }), '/blog?offset=20&count=10');
            deepEqual(build(blog_list, { count: 5 }), '/blog?count=5');
            deepEqual(build(blog_search, { phrase: '3D modeling' }), '/blog/search?phrase=3D%20modeling');
        });

        it('mix routes', () => {
            deepEqual(build(blog_by_tag_or_sort_by_date, { tag: "123" }), '/blog/tag-123');
            deepEqual(build(blog_by_tag_or_sort_by_date, { tag: "git", sort: Order.Asc }), '/blog/tag-git');
            deepEqual(build(blog_by_tag_or_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            deepEqual(build(blog_by_tag_and_opt_sort_by_date, { tag: "es6" }), '/blog/tag-es6');
            deepEqual(build(blog_by_tag_and_opt_sort_by_date, { tag: "js", sort: Order.Desc }), '/blog/tag-js/date-desc');
        });
    });
});
