let message: string = 'Hello, World!';
// create a new heading 1 element
let heading = document.createElement('h1');
heading.textContent = message;
// add the heading the document
document.body.appendChild(heading);

function openPopup(el: Element, ev: Event, url: String) {

}

function getPopupContainerParent() : Element | null{
    return document.querySelector('html');
}

// Cached value.
var popupContainer : Element | null;
function getPopupContainer() : Element | null {
    if(popupContainer) {return popupContainer;}
    return popupContainer = document.querySelector('.popupContainer');
}

function createPopupContainer(){
    if (getPopupContainer()){
        console.log("Error: popup container already created!");
        return;
    }
    var parent = getPopupContainerParent();
    if(!parent){
        console.log("Error: could not find popup container parent element!");
        return;
    }
    parent.insertAdjacentHTML("beforeend", `<div
        	class="popupContainer"
        	style="z-index: 10000;"
        		></div>`);
    requestAnimationFrame(function(time){
        // Cache ahead of user action.
        getPopupContainer();
    });
}

document.querySelectorAll('.forceAnnotate').forEach(function(element) {
    var href = element.getAttribute("href");
    if (!element.classList.contains('annotationComplete')) {
        if(href){
            // mouseleave - fired when pointer exits element and all decendants
            // mouseout - fired when pointer leaves the element or leaves one of the decendents
            // mouseover - fired when the mouse pointer enters the div or child element
            // mouseenter - fired only when the mouse pointer enters the div
            element.addEventListener('mouseenter', function(event){openPopup(element, event, href!)});

            element.classList.add('annotationComplete');
        }
    }
});