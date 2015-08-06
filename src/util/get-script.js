module.exports = {
    req: function (url, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement('script');
        var done = false;

        script.src = url;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function() {
            if ( !done && (!this.readyState ||
                    this.readyState === "loaded" || this.readyState === "complete") ) {
                done = true;

                callback();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                if ( head && script.parentNode ) {
                    head.removeChild( script );
                }
            }
        };

        // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
        // This arises when a base node is used (#2709 and #4378).
        head.insertBefore( script, head.firstChild );
    }
};
