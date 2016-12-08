module.exports = {
    getContext: function(context) {
        return context;
    },
    afterParse: function(block_output) {
        return '<form class="form-part" method="post" action="/ajax/contact"><input type="hidden" name="_token" value="{{csrf_token}}">' + block_output + '</form>';
    }
};