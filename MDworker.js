var window = this;

importScripts('./bower_components/markdown/lib/markdown.js')


onmessage = function(e){

    postMessage(markdown.toHTML(e.data));

}