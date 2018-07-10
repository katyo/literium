import { deepStrictEqual as dse } from 'assert';
import { some, none, keyed } from 'literium-base';
import { match, build, match_paired, build_paired, match_keyed, build_keyed } from '../src/router';
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
                dse(match(root)('/'), some({}));
            });
            it('fail', () => {
                dse(match(root)('/other'), none());
                dse(match(root)('/blog'), none());
            });
        });

        describe('single num arg', () => {
            it('pass', () => {
                dse(match(post_by_id)('/blog/0'), some({ id: 0 }));
                dse(match(post_by_id)('/blog/1'), some({ id: 1 }));
                dse(match(post_by_id)('/blog/123'), some({ id: 123 }));
            });
            it('fail', () => {
                dse(match(post_by_id)('/blog/-1'), none());
                dse(match(post_by_id)('/blog/tag'), none());
                dse(match(post_by_id)('/node'), none());
                dse(match(post_by_id)('/'), none());
            });
        });

        describe('single str arg', () => {
            it('pass', () => {
                dse(match(blog_by_tag)('/blog/tag-123'), some({ tag: "123" }));
                dse(match(blog_by_tag)('/blog/tag-git'), some({ tag: "git" }));
            });
            it('fail', () => {
                dse(match(blog_by_tag)('/blog/1'), none());
                dse(match(blog_by_tag)('/blog/tag'), none());
                dse(match(blog_by_tag)('/node'), none());
                dse(match(blog_by_tag)('/'), none());
            });
        });

        describe('single ord arg', () => {
            it('pass', () => {
                dse(match(blog_sort_by_date)('/blog/date-asc'), some({ sort: Order.Asc }));
                dse(match(blog_sort_by_date)('/blog/date-desc'), some({ sort: Order.Desc }));
            });
            it('fail', () => {
                dse(match(blog_sort_by_date)('/blog/date-abc'), none());
                dse(match(blog_sort_by_date)('/blog/tag'), none());
                dse(match(blog_sort_by_date)('/node'), none());
                dse(match(blog_sort_by_date)('/'), none());
            });
        });

        describe('str and ord args', () => {
            it('pass', () => {
                dse(match(blog_by_tag_and_sort_by_date)('/blog/tag-123/date-asc'), some({ tag: "123", sort: Order.Asc }));
                dse(match(blog_by_tag_and_sort_by_date)('/blog/tag-git/date-desc'), some({ tag: "git", sort: Order.Desc }));
            });
            it('fail', () => {
                dse(match(blog_by_tag_and_sort_by_date)('/blog/tag-car/date-abc'), none());
                dse(match(blog_by_tag_and_sort_by_date)('/blog/1'), none());
                dse(match(blog_by_tag_and_sort_by_date)('/blog/tag-123'), none());
                dse(match(blog_by_tag_and_sort_by_date)('/blog/tag'), none());
                dse(match(blog_by_tag_and_sort_by_date)('/node'), none());
                dse(match(blog_by_tag_and_sort_by_date)('/'), none());
            });
        });

        describe('alternatives', () => {
            it('pass', () => {
                dse(match(author_by_id_or_name)('/author/123/info'), some({ author: 123 }));
                dse(match(author_by_id_or_name)('/author/kay/info'), some({ author: 'kay' }));
                dse(match(author_by_id_or_name_alt)('/author/123/info'), some({ id: 123 }));
                dse(match(author_by_id_or_name_alt)('/author/kay/info'), some({ name: 'kay' }));
            });
        });

        describe('query args', () => {
            it('pass', () => {
                dse(match(blog_list)('/blog?offset=20&count=10'), some({ offset: 20, count: 10 }));
                dse(match(blog_list)('/blog?count=10&offset=20&other'), some({ offset: 20, count: 10 }));
                dse(match(blog_list)('/blog?count=5'), some({ count: 5 }));
                dse(match(blog_list_alt)('/blog?offset=1'), some({ offset: 1, count: 10 }));
                dse(match(blog_list_alt)('/blog?count=5'), some({ count: 5 }));
                dse(match(blog_search)('/blog/search?phrase=3D%20modeling'), some({ phrase: '3D modeling' }));
            });
            it('fail', () => {
                dse(match(blog_list)('/blog'), none());
                dse(match(blog_list)('/blog?'), none());
                dse(match(blog_list)('/blog/?count=5'), none());
                dse(match(blog_list)('/blog/?offset=20&count=10'), none());
                dse(match(blog_list_alt)('/blog?offset=max'), none());
                dse(match(blog_list_alt)('/blog?count=no'), none());
                dse(match(blog_search)('/blog/search'), none());
                dse(match(blog_search)('/blog/search?phrase'), none());
            });
        });

        describe('mix routes', () => {
            it('pass', () => {
                dse(match(blog_by_tag_or_sort_by_date)('/blog/tag-123'), some({ tag: "123" }));
                dse(match(blog_by_tag_or_sort_by_date)('/blog/date-asc'), some({ sort: Order.Asc }));
                dse(match(blog_by_tag_and_opt_sort_by_date)('/blog/tag-es6'), some({ tag: "es6" }));
                dse(match(blog_by_tag_and_opt_sort_by_date)('/blog/tag-js/date-desc'), some({ tag: "js", sort: Order.Desc }));
            });

            it('fail', () => {
                dse(match(blog_by_tag_or_sort_by_date)('/blog/tag-123/date-abc'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/blog/1'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/blog/tag-'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/blog/tag-js/'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/blog/tag'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/node'), none());
                dse(match(blog_by_tag_or_sort_by_date)('/'), none());
                dse(match(blog_by_tag_and_opt_sort_by_date)('/blog/date-asc'), none());
                dse(match(blog_by_tag_and_opt_sort_by_date)('/blog/tag-js/date-other'), none());
                dse(match(blog_by_tag_and_opt_sort_by_date)('/blog/tag-js/date-asc/'), none());
            });
        });
    });

    describe('build', () => {
        it('root', () => {
            dse(build(root)({}), some('/'));
        });

        it('single num arg', () => {
            dse(build(post_by_id)({ id: 0 }), some('/blog/0'));
            dse(build(post_by_id)({ id: 1 }), some('/blog/1'));
            dse(build(post_by_id)({ id: 123 }), some('/blog/123'));
        });

        it('single str arg', () => {
            dse(build(blog_by_tag)({ tag: "123" }), some('/blog/tag-123'));
            dse(build(blog_by_tag)({ tag: "git" }), some('/blog/tag-git'));
        });

        it('single ord arg', () => {
            dse(build(blog_sort_by_date)({ sort: Order.Asc }), some('/blog/date-asc'));
            dse(build(blog_sort_by_date)({ sort: Order.Desc }), some('/blog/date-desc'));
        });

        it('str and ord args', () => {
            dse(build(blog_by_tag_and_sort_by_date)({ tag: "123", sort: Order.Asc }), some('/blog/tag-123/date-asc'));
            dse(build(blog_by_tag_and_sort_by_date)({ tag: "git", sort: Order.Desc }), some('/blog/tag-git/date-desc'));
        });

        it('alternatives', () => {
            dse(build(author_by_id_or_name)({ author: 123 }), some('/author/123/info'));
            dse(build(author_by_id_or_name)({ author: 'kay' }), some('/author/kay/info'));
            dse(build(author_by_id_or_name_alt)({ id: 123 }), some('/author/123/info'));
            dse(build(author_by_id_or_name_alt)({ name: 'kay' }), some('/author/kay/info'));
        });

        it('query args', () => {
            dse(build(blog_list)({ offset: 20, count: 10 }), some('/blog?offset=20&count=10'));
            dse(build(blog_list)({ count: 10, offset: 20 }), some('/blog?offset=20&count=10'));
            dse(build(blog_list)({ count: 5 }), some('/blog?count=5'));
            dse(build(blog_list_alt)({ offset: 5, count: 10 }), some('/blog?offset=5'));
            dse(build(blog_list_alt)({ offset: undefined, count: 11 }), some('/blog?count=11'));
            dse(build(blog_search)({ phrase: '3D modeling' }), some('/blog/search?phrase=3D%20modeling'));
        });

        it('mix routes', () => {
            dse(build(blog_by_tag_or_sort_by_date)({ tag: "123" }), some('/blog/tag-123'));
            dse(build(blog_by_tag_or_sort_by_date)({ tag: "git", sort: Order.Asc }), some('/blog/tag-git'));
            dse(build(blog_by_tag_or_sort_by_date)({ sort: Order.Asc }), some('/blog/date-asc'));
            dse(build(blog_by_tag_and_opt_sort_by_date)({ tag: "es6" }), some('/blog/tag-es6'));
            dse(build(blog_by_tag_and_opt_sort_by_date)({ tag: "js", sort: Order.Desc }), some('/blog/tag-js/date-desc'));
        });
    });
});

describe('routes', () => {
    describe('match_paired', () => {
        dse(match_paired(routes)('/'), some({ root: {} }));
        dse(match_paired(routes)('/blog/123'), some({ post_by_id: { id: 123 } }));
        dse(match_paired(routes)('/blog/search?phrase=3D%20modeling'), some({ blog_search: { phrase: "3D modeling" } }));
    });

    describe('build_paired', () => {
        dse(build_paired(routes)({ root: {} }), some('/'));
        dse(build_paired(routes)({ post_by_id: { id: 123 } }), some('/blog/123'));
        dse(build_paired(routes)({ blog_search: { phrase: "3D modeling" } }), some('/blog/search?phrase=3D%20modeling'));
    });

    describe('match_keyed', () => {
        dse(match_keyed(routes)('/'), some(keyed('root' as 'root', {})));
        dse(match_keyed(routes)('/blog/123'), some(keyed('post_by_id' as 'post_by_id', { id: 123 })));
        dse(match_keyed(routes)('/blog/search?phrase=3D%20modeling'), some(keyed('blog_search' as 'blog_search', { phrase: "3D modeling" })));
    });

    describe('build_keyed', () => {
        dse(build_keyed(routes)(keyed('root' as 'root', {})), some('/'));
        dse(build_keyed(routes)(keyed('post_by_id' as 'post_by_id', { id: 123 })), some('/blog/123'));
        dse(build_keyed(routes)(keyed('blog_search' as 'blog_search', { phrase: "3D modeling" })), some('/blog/search?phrase=3D%20modeling'));
    });
});
