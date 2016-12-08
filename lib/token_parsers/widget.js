module.exports = function (Twig) {

    Twig.logic.extend({
        type: 'Twig.logic.type.endwidget',
        regex: /^endwidget(?:\s+([a-zA-Z0-9_]+))?$/,
        next: [],
        open: false
    });

    Twig.logic.extend({
        type: 'Twig.logic.type.widget',
        regex: /^widget\s+([a-zA-Z0-9_]+)$/,
        next: [
            'Twig.logic.type.endwidget'
        ],
        open: true,
        compile: function (token) {
            token.widget = token.match[1].trim();
            token.block = 'twig_doodad_' + token.widget;
            delete token.match;
            return token;
        },
        parse: function (token, context, chain) {
            var block_output,
                output,
                isImported = Twig.indexOf(this.importedBlocks, token.block) > -1,
                hasParent = this.blocks[token.block] && Twig.indexOf(this.blocks[token.block], Twig.placeholders.parent) > -1;

            // Get widget based context
            var widget = require('../widgets/' + token.widget + '.js');

            // Get widget context
            context = widget.getContext(context);

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

                // After widget logic
                block_output = widget.afterParse(block_output);

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

                this.originalBlockTokens[token.block] = {
                    type: token.type,
                    block: token.block,
                    output: token.output,
                    overwrite: true
                };
            }

            // Check if a child block has been set from a template extending this one.
            if (this.child.blocks[token.block]) {
                output = this.child.blocks[token.block];
            }
            else {
                output = this.blocks[token.block];
            }

            return {
                chain: chain,
                output: output
            };
        }
    });
};