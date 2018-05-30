import { deepStrictEqual as dse } from 'assert';
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
    blog_list_alt,
    blog_search,
    author_by_id_or_name,
    author_by_id_or_name_alt,
} = routes;

describe('route', () => {
    describe('match', () => {
        describe('root', () => {
            it('pass', () => {
                dse(match(root, '/'), {});
            });
            it('fail', () => {
                dse(match(root, '/other'), undefined);
                dse(match(root, '/blog'), undefined);
            });
        });

        describe('single num arg', () => {
            it('pass', () => {
                dse(match(post_by_id, '/blog/0'), { id: 0 });
                dse(match(post_by_id, '/blog/1'), { id: 1 });
                dse(match(post_by_id, '/blog/123'), { id: 123 });
            });
            it('fail', () => {
                dse(match(post_by_id, '/blog/-1'), undefined);
                dse(match(post_by_id, '/blog/tag'), undefined);
                dse(match(post_by_id, '/node'), undefined);
                dse(match(post_by_id, '/'), undefined);
            });
        });

        describe('single str arg', () => {
            it('pass', () => {
                dse(match(blog_by_tag, '/blog/tag-123'), { tag: "123" });
                dse(match(blog_by_tag, '/blog/tag-git'), { tag: "git" });
            });
            it('fail', () => {
                dse(match(blog_by_tag, '/blog/1'), undefined);
                dse(match(blog_by_tag, '/blog/tag'), undefined);
                dse(match(blog_by_tag, '/node'), undefined);
                dse(match(blog_by_tag, '/'), undefined);
            });
        });

        describe('single ord arg', () => {
            it('pass', () => {
                dse(match(blog_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                dse(match(blog_sort_by_date, '/blog/date-desc'), { sort: Order.Desc });
            });
            it('fail', () => {
                dse(match(blog_sort_by_date, '/blog/date-abc'), undefined);
                dse(match(blog_sort_by_date, '/blog/tag'), undefined);
                dse(match(blog_sort_by_date, '/node'), undefined);
                dse(match(blog_sort_by_date, '/'), undefined);
            });
        });

        describe('str and ord args', () => {
            it('pass', () => {
                dse(match(blog_by_tag_and_sort_by_date, '/blog/tag-123/date-asc'), { tag: "123", sort: Order.Asc });
                dse(match(blog_by_tag_and_sort_by_date, '/blog/tag-git/date-desc'), { tag: "git", sort: Order.Desc });
            });
            it('fail', () => {
                dse(match(blog_by_tag_and_sort_by_date, '/blog/tag-car/date-abc'), undefined);
                dse(match(blog_by_tag_and_sort_by_date, '/blog/1'), undefined);
                dse(match(blog_by_tag_and_sort_by_date, '/blog/tag-123'), undefined);
                dse(match(blog_by_tag_and_sort_by_date, '/blog/tag'), undefined);
                dse(match(blog_by_tag_and_sort_by_date, '/node'), undefined);
                dse(match(blog_by_tag_and_sort_by_date, '/'), undefined);
            });
        });

        describe('alternatives', () => {
            it('pass', () => {
                dse(match(author_by_id_or_name, '/author/123/info'), { author: 123 });
                dse(match(author_by_id_or_name, '/author/kay/info'), { author: 'kay' });
                dse(match(author_by_id_or_name_alt, '/author/123/info'), { id: 123 });
                dse(match(author_by_id_or_name_alt, '/author/kay/info'), { name: 'kay' });
            });
        });

        describe('query args', () => {
            it('pass', () => {
                dse(match(blog_list, '/blog?offset=20&count=10'), { offset: 20, count: 10 });
                dse(match(blog_list, '/blog?count=10&offset=20&other'), { offset: 20, count: 10 });
                dse(match(blog_list, '/blog?count=5'), { count: 5 });
                dse(match(blog_list_alt, '/blog?offset=1'), { offset: 1, count: 10 });
                dse(match(blog_list_alt, '/blog?count=5'), { count: 5 });
                dse(match(blog_search, '/blog/search?phrase=3D%20modeling'), { phrase: '3D modeling' });
            });
            it('fail', () => {
                dse(match(blog_list, '/blog'), undefined);
                dse(match(blog_list, '/blog?'), undefined);
                dse(match(blog_list, '/blog/?count=5'), undefined);
                dse(match(blog_list, '/blog/?offset=20&count=10'), undefined);
                dse(match(blog_list_alt, '/blog?offset=max'), undefined);
                dse(match(blog_list_alt, '/blog?count=no'), undefined);
                dse(match(blog_search, '/blog/search'), undefined);
                dse(match(blog_search, '/blog/search?phrase'), undefined);
            });
        });

        describe('mix routes', () => {
            it('pass', () => {
                dse(match(blog_by_tag_or_sort_by_date, '/blog/tag-123'), { tag: "123" });
                dse(match(blog_by_tag_or_sort_by_date, '/blog/date-asc'), { sort: Order.Asc });
                dse(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-es6'), { tag: "es6" });
                dse(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-desc'), { tag: "js", sort: Order.Desc });
            });

            it('fail', () => {
                dse(match(blog_by_tag_or_sort_by_date, '/blog/tag-123/date-abc'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/blog/1'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/blog/tag-'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/blog/tag-js/'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/blog/tag'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/node'), undefined);
                dse(match(blog_by_tag_or_sort_by_date, '/'), undefined);
                dse(match(blog_by_tag_and_opt_sort_by_date, '/blog/date-asc'), undefined);
                dse(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-other'), undefined);
                dse(match(blog_by_tag_and_opt_sort_by_date, '/blog/tag-js/date-asc/'), undefined);
            });
        });
    });

    describe('build', () => {
        it('root', () => {
            dse(build(root, {}), '/');
        });

        it('single num arg', () => {
            dse(build(post_by_id, { id: 0 }), '/blog/0');
            dse(build(post_by_id, { id: 1 }), '/blog/1');
            dse(build(post_by_id, { id: 123 }), '/blog/123');
        });

        it('single str arg', () => {
            dse(build(blog_by_tag, { tag: "123" }), '/blog/tag-123');
            dse(build(blog_by_tag, { tag: "git" }), '/blog/tag-git');
        });

        it('single ord arg', () => {
            dse(build(blog_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            dse(build(blog_sort_by_date, { sort: Order.Desc }), '/blog/date-desc');
        });

        it('str and ord args', () => {
            dse(build(blog_by_tag_and_sort_by_date, { tag: "123", sort: Order.Asc }), '/blog/tag-123/date-asc');
            dse(build(blog_by_tag_and_sort_by_date, { tag: "git", sort: Order.Desc }), '/blog/tag-git/date-desc');
        });

        it('alternatives', () => {
            dse(build(author_by_id_or_name, { author: 123 }), '/author/123/info');
            dse(build(author_by_id_or_name, { author: 'kay' }), '/author/kay/info');
            dse(build(author_by_id_or_name_alt, { id: 123 }), '/author/123/info');
            dse(build(author_by_id_or_name_alt, { name: 'kay' }), '/author/kay/info');
        });

        it('query args', () => {
            dse(build(blog_list, { offset: 20, count: 10 }), '/blog?offset=20&count=10');
            dse(build(blog_list, { count: 10, offset: 20 }), '/blog?offset=20&count=10');
            dse(build(blog_list, { count: 5 }), '/blog?count=5');
            dse(build(blog_list_alt, { offset: 5, count: 10 }), '/blog?offset=5');
            dse(build(blog_list_alt, { offset: undefined, count: 11 }), '/blog?count=11');
            dse(build(blog_search, { phrase: '3D modeling' }), '/blog/search?phrase=3D%20modeling');
        });

        it('mix routes', () => {
            dse(build(blog_by_tag_or_sort_by_date, { tag: "123" }), '/blog/tag-123');
            dse(build(blog_by_tag_or_sort_by_date, { tag: "git", sort: Order.Asc }), '/blog/tag-git');
            dse(build(blog_by_tag_or_sort_by_date, { sort: Order.Asc }), '/blog/date-asc');
            dse(build(blog_by_tag_and_opt_sort_by_date, { tag: "es6" }), '/blog/tag-es6');
            dse(build(blog_by_tag_and_opt_sort_by_date, { tag: "js", sort: Order.Desc }), '/blog/tag-js/date-desc');
        });
    });
});
