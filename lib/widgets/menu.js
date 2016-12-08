module.exports = {
    getContext: function(context) {
        return {
            links: config.navigation
        };
    },
    afterParse: function(block_output) {
        return block_output;
    }
};