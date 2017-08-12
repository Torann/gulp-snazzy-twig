module.exports = function (Twig) {

    Twig.logic.extend({
        type: 'Twig.logic.type.endinject',
        regex: /^endinject(?:\s+([a-zA-Z0-9_]+))?$/,
        next: [],
        open: false
    });

    Twig.logic.extend({
        type: 'Twig.logic.type.inject',
        regex: /^inject(?:\s+([a-zA-Z0-9_]+))?/,
        next: [
            'Twig.logic.type.endinject'
        ],
        open: true,
        compile: function (token) {
            token.block =  token.match[1].trim();
            delete token.match;
            return token;
        },
        parse: function (token, context, chain) {
            var block_output,
                isImported = Twig.indexOf(this.importedBlocks, token.block) > -1,
                hasParent = this.blocks[token.block] && Twig.indexOf(this.blocks[token.block], Twig.placeholders.parent) > -1;

            // Don't override previous blocks unless they're imported with "use"
            // Loops should be exempted as well.
            if (this.blocks[token.block] === undefined || isImported || hasParent || context.loop || token.overwrite) {
                if (token.expression) {
                    // Short blocks have output as an expression on the open tag (no body)
                    block_output = Twig.expression.parse.apply(this, [{
                        type: Twig.expression.type.string,
                        value: Twig.expression.parse.apply(this, [token.output, context])
                    }, context]);
                }
                else {
                    block_output = Twig.expression.parse.apply(this, [{
                        type: Twig.expression.type.string,
                        value: Twig.parse.apply(this, [token.output, context])
                    }, context]);
                }

                if (isImported) {
                    // once the block is overridden, remove it from the list of imported blocks
                    this.importedBlocks.splice(this.importedBlocks.indexOf(token.block), 1);
                }

                if (hasParent) {
                    this.blocks[token.block] = Twig.Markup(this.blocks[token.block].replace(Twig.placeholders.parent, block_output));
                }
                else {
                    this.blocks[token.block] = block_output;
                }
            }

            return {
                chain: chain,
                output: ''
            };
        }
    });
};