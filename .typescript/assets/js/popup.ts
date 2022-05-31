let message: string = 'Hello, World!';
// create a new heading 1 element
let heading = document.createElement('h1');
heading.textContent = message;
// add the heading the document
document.body.appendChild(heading);

function openPopup(e: Event, url: String) {

}

document.querySelectorAll('.forceAnnotate').forEach(function(element) {
    var href = element.getAttribute("href");
    if (!element.classList.contains('annotationComplete')) {
        if(href){
            // mouseleave - fired when pointer exits element and all decendants
            // mouseout - fired when pointer leaves the element or leaves one of the decendents
            // mouseover - fired when the mouse pointer enters the div or child element
            // mouseenter - fired only when the mouse pointer enters the div
            element.addEventListener('mouseenter', function(element){openPopup(element, href!)});

            element.classList.add('annotationComplete');
        }
    }
});