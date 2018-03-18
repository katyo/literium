import { fail, equal } from 'assert';
import { ScriptTarget, ModuleKind, createProgram, getPreEmitDiagnostics, Diagnostic, DiagnosticMessageChain } from 'typescript';

const opts = {
    noImplicitAny: true,
    strictNullChecks: true,
    declaration: false,
    noUnusedLocals: true,
    //noEmit: true,
    noEmitOnError: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
};

function lastMessage({ messageText }: Diagnostic): string {
    if (typeof messageText == 'string') return messageText;
    let chain = messageText;
    for (; chain.next; chain = chain.next);
    return chain.messageText;
}

function test(file: string, errors: string[] = []) {
    console.log(`Test case ${file}`);
    const program = createProgram([`${__dirname}/typing/${file}.ts`], opts);
    const { diagnostics } = program.emit();
    if (errors.length > 0) {
        if (errors.length != diagnostics.length) {
            console.log(diagnostics);
            fail("The expected errors doesn't match.");
        }
        for (let i = 0; i < diagnostics.length; i++) {
            equal(lastMessage(diagnostics[i]), errors[i]);
        }
    } else {
        if (diagnostics.length > 0) {
            for (const diagnostic of diagnostics) {
                console.log(lastMessage(diagnostic));
            }
        }
    }
}

test("missing_prop", ["Property 'id' is missing in type '{}'."]);
test("extra_prop", []);
