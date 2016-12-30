var window = this;

importScripts('./bower_components/markdown/lib/markdown.js')


onmessage = function(e){
    let msg = e.data ||"(空白内容/EMPTY)";
    postMessage(markdown.toHTML(msg));

}