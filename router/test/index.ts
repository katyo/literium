import { deepEqual } from 'assert';
import { Order, root, post_by_id, blog_by_tag, blog_sort_by_date, blog_by_tag_and_sort_by_date } from './routes';

describe('route', () => {
    describe('match', () => {
        describe('root', () => {
            it('pass', () => {
                deepEqual(root.match('/'), {});
            });
            it('fail', () => {
                deepEqual(root.match('/other'), undefined);
                deepEqual(root.match('/blog'), undefined);
            });
        });

        describe('single num arg', () => {
            it('pass', () => {
                deepEqual(post_by_id.match('/blog/0'), { id: 0 });
                deepEqual(post_by_id.match('/blog/1'), { id: 1 });
                deepEqual(post_by_id.match('/blog/123'), { id: 123 });
            });
            it('fail', () => {
                deepEqual(post_by_id.match('/blog/-1'), undefined);
                deepEqual(post_by_id.match('/blog/tag'), undefined);
                deepEqual(post_by_id.match('/node'), undefined);
                deepEqual(post_by_id.match('/'), undefined);
            });
        });

        describe('single str arg', () => {
            it('pass', () => {
                deepEqual(blog_by_tag.match('/blog/tag-123'), { tag: "123" });
                deepEqual(blog_by_tag.match('/blog/tag-git'), { tag: "git" });
            });
            it('fail', () => {
                deepEqual(blog_by_tag.match('/blog/1'), undefined);
                deepEqual(blog_by_tag.match('/blog/tag'), undefined);
                deepEqual(blog_by_tag.match('/node'), undefined);
                deepEqual(blog_by_tag.match('/'), undefined);
            });
        });

        describe('single ord arg', () => {
            it('pass', () => {
                deepEqual(blog_sort_by_date.match('/blog/date-asc'), { sort: Order.Asc });
                deepEqual(blog_sort_by_date.match('/blog/date-desc'), { sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(blog_sort_by_date.match('/blog/date-abc'), undefined);
                deepEqual(blog_sort_by_date.match('/blog/tag'), undefined);
                deepEqual(blog_sort_by_date.match('/node'), undefined);
                deepEqual(blog_sort_by_date.match('/'), undefined);
            });
        });

        describe('str and ord args', () => {
            it('pass', () => {
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/tag-123/date-asc'), { tag: "123", sort: Order.Asc });
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/tag-git/date-desc'), { tag: "git", sort: Order.Desc });
            });
            it('fail', () => {
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/tag-car/date-abc'), undefined);
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/1'), undefined);
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/tag-123'), undefined);
                deepEqual(blog_by_tag_and_sort_by_date.match('/blog/tag'), undefined);
                deepEqual(blog_by_tag_and_sort_by_date.match('/node'), undefined);
                deepEqual(blog_by_tag_and_sort_by_date.match('/'), undefined);
            });
        });
    });

    describe('build', () => {
        it('root', () => {
            deepEqual(root.build({}), '/');
        });

        it('single num arg', () => {
            deepEqual(post_by_id.build({ id: 0 }), '/blog/0');
            deepEqual(post_by_id.build({ id: 1 }), '/blog/1');
            deepEqual(post_by_id.build({ id: 123 }), '/blog/123');
        });

        it('single str arg', () => {
            deepEqual(blog_by_tag.build({ tag: "123" }), '/blog/tag-123');
            deepEqual(blog_by_tag.build({ tag: "git" }), '/blog/tag-git');
        });

        it('single ord arg', () => {
            deepEqual(blog_sort_by_date.build({ sort: Order.Asc }), '/blog/date-asc');
            deepEqual(blog_sort_by_date.build({ sort: Order.Desc }), '/blog/date-desc');
        });

        it('str and ord args', () => {
            deepEqual(blog_by_tag_and_sort_by_date.build({ tag: "123", sort: Order.Asc }), '/blog/tag-123/date-asc');
            deepEqual(blog_by_tag_and_sort_by_date.build({ tag: "git", sort: Order.Desc }), '/blog/tag-git/date-desc');
        });
    });
});
