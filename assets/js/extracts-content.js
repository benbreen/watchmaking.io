/***************************************/
/*  Events fired by extracts-content.js:

    GW.contentDidLoad {
            source: "Extracts.rewritePopFrameContent_CITATION"
            document:
                The contentView of the citation pop-frame.
            location:
                URL of (i.e., anchor-link to) the footnote (or sidenote; this
                depends on whether the page in which the citation appears -
                which may not necessarily be the main page, as citations may
                also occur in embedded pages - is currently in sidenotes mode
                or not).
            flags:
                0 (no flags set)
        }
        Fired when a citation (i.e., footnote) pop-frame has been filled with
        content (i.e., the footnote), at the last stage of preparing the
        pop-frame for spawning (being injected into the page and positioned).

        (See rewrite.js for more information about the keys and values of the
         GW.contentDidLoad event.)

    GW.contentDidLoad {
            source: "Extracts.rewritePopupContent_CITATION_BACK_LINK"
            document:
                The contentView of the citation back-link popup.
            location:
                URL of (i.e., anchor-link to) the citation which references the
                footnote/sidenote which spawned the popup. (If there are
                multiple instances of the citation on the page, this will be the
                URL of the first one, and that is what the popup will contain.)
            flags:
                0 (no flags set)
        }
        Fired when a citation back-link popup has been filled with content
        (i.e., the text surrounding the reference which links to the footnote),
        at the last stage of preparing the popup for spawning (being
        injected into the page and positioned).

        (See rewrite.js for more information about the keys and values of the
         GW.contentDidLoad event.)

    GW.contentDidLoad {
            source: "Extracts.rewritePopFrameContent_AUX_LINKS_LINK"
            document:
                The contentView of the aux-links pop-frame.
            location:
                URL of the aux-links source file.
            flags:
                0 (no flags set)
        }
        Fired at the last stage of preparing an aux-links pop-frame for spawning
        (after the pop-frame’s content has been loaded from the local aux-links
        frame cache).

        (See rewrite.js for more information about the keys and values of the
         GW.contentDidLoad event.)

    GW.contentDidLoad {
            source: "Extracts.refreshPopFrameAfterAuxLinksLoad"
            document:
                A DocumentFragment containing the aux-links elements.
            location:
                URL of the aux-links source file.
            flags: GW.contentDidLoadEventFlags.needsRewrite
        }
        Fired when the content of the aux-links pop-frame has been constructed,
        but not yet injected into a pop-frame.

        (See rewrite.js for more information about the keys and values of the
         GW.contentDidLoad event.)
*/

/*=-----------------=*/
/*= AUXILIARY LINKS =*/
/*=-----------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "AUX_LINKS_LINK",       // Type name
    "isAuxLinksLink",       // Type predicate function
    "has-content",          // Target classes to add
    "auxLinksForTarget",    // Pop-frame fill function
    "aux-links"             // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    auxLinksCache: { },

    //  Called by: Extracts.isAuxLinksLink
    //  Called by: Extracts.titleForPopFrame_AUX_LINKS_LINK
    auxLinksLinkType: (target) => {
        if (target.pathname.startsWith("/metadata/annotations/") == false)
            return null;

        return /^\/metadata\/annotations\/([^\/]+)/.exec(target.pathname)[1];
    },

    //  Called by: Extracts.isLocalCodeFileLink
    //  Called by: extracts.js (as `predicateFunctionName`)
    isAuxLinksLink: (target) => {
        let auxLinksLinkType = Extracts.auxLinksLinkType(target);
        return (auxLinksLinkType && target.classList.contains(auxLinksLinkType));
    },

    /*  Backlinks, similar-links, etc.
     */
    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    auxLinksForTarget: (target) => {
        GWLog("Extracts.auxLinksForTarget", "extracts-content.js", 2);

        if (Extracts.auxLinksCache[target.pathname]) {
            return Extracts.newDocument(Extracts.auxLinksCache[target.pathname]);
        } else {
            Extracts.refreshPopFrameAfterAuxLinksLoad(target);

            return Extracts.newDocument();
        }
    },

    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_AUX_LINKS_LINK: (popFrame) => {
        let target = popFrame.spawningTarget;

        //  Fire a contentDidLoad event.
        GW.notificationCenter.fireEvent("GW.contentDidLoad", {
            source: "Extracts.rewritePopFrameContent_AUX_LINKS_LINK",
            document: popFrame.contentView,
            location: Extracts.locationForTarget(target),
            flags: 0
        });
    },

    /*  Page or document for whom the aux-links are.
     */
    //  Called by: Extracts.titleForPopFrame_AUX_LINKS_LINK
    targetOfAuxLinksLink: (target) => {
        return decodeURIComponent(decodeURIComponent(/\/metadata\/annotations\/[^\/]+?\/(.+?)\.html$/.exec(target.pathname)[1]));
    },

    //  Called by: extracts.js (as `titleForPopFrame_${targetTypeName}`)
    titleForPopFrame_AUX_LINKS_LINK: (popFrame) => {
        let target = popFrame.spawningTarget;
        let targetPage = Extracts.targetOfAuxLinksLink(target);
        let auxLinksLinkType = Extracts.auxLinksLinkType(target);
        switch (auxLinksLinkType) {
            case "backlinks":
                return `${targetPage} (Backlinks)`;
            case "similars":
                return `${targetPage} (Similar)`;
            default:
                return `${targetPage}`;
        }
    },

    /*  Refresh (respawn or reload) a pop-frame for an aux-link link after the
        aux-links source loads.
     */
    //  Called by: Extracts.auxLinksForTarget
    refreshPopFrameAfterAuxLinksLoad: (target) => {
        GWLog("Extracts.refreshPopFrameAfterAuxLinksLoad", "extracts-content.js", 2);

        target.popFrame.classList.toggle("loading", true);

        doAjax({
            location: target.href,
            onSuccess: (event) => {
                if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                    return;

                //  Cache the aux-links source.
                Extracts.auxLinksCache[target.pathname] = Extracts.newDocument(event.target.responseText);

                /*  Trigger the rewrite pass by firing the requisite event.
                    */
                GW.notificationCenter.fireEvent("GW.contentDidLoad", {
                    source: "Extracts.refreshPopFrameAfterAuxLinksLoad",
                    document: Extracts.auxLinksCache[target.pathname],
                    location: Extracts.locationForTarget(target),
                    flags: GW.contentDidLoadEventFlags.needsRewrite
                });

                //  Re-spawn, or fill and rewrite, the pop-frame.
                if (Extracts.popFrameProvider == Popups) {
                    Popups.spawnPopup(target);
                } else if (Extracts.popFrameProvider == Popins) {
                    Extracts.fillPopFrame(target.popin);
                    target.popin.classList.toggle("loading", false);

                    Extracts.rewritePopinContent(target.popin);

                    requestAnimationFrame(() => {
                        Popins.scrollPopinIntoView(target.popin);
                    });
                }
            },
            onFailure: (event) => {
                if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                    return;

                target.popFrame.swapClasses([ "loading", "loading-failed" ], 1);
            }
        });
    }
}};

/*=-----------=*/
/*= CITATIONS =*/
/*=-----------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "CITATION",             // Type name
    "isCitation",           // Type predicate function
    null,                   // Target classes to add
    "citationForTarget",    // Pop-frame fill function
    "footnote"              // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Called by: extracts.js (as `predicateFunctionName`)
    isCitation: (target) => {
        return target.classList.contains("footnote-ref");
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    citationForTarget: (target) => {
        GWLog("Extracts.citationForTarget", "extracts-content.js", 2);

        return Extracts.localTranscludeForTarget(target, (blockElement) => {
            return target.hash.startsWith("#sn")
                   ? blockElement.querySelector(".sidenote-inner-wrapper").children
                   : blockElement.children;
        }, true);
    },

    //  Called by: extracts.js (as `titleForPopFrame_${targetTypeName}`)
    titleForPopFrame_CITATION: (popFrame) => {
        let target = popFrame.spawningTarget;
        let footnoteNumber = target.querySelector("sup").textContent;
        let popFrameTitleText = `Footnote #${footnoteNumber}`;

        return Extracts.standardPopFrameTitleElementForTarget(target, popFrameTitleText);
    },

    //  Called by: extracts.js (as `preparePopup_${targetTypeName}`)
    preparePopup_CITATION: (popup) => {
        let target = popup.spawningTarget;

        /*  Do not spawn footnote popup if the {side|foot}note it points to is
            visible.
         */
        if (Array.from(allNotesForCitation(target)).findIndex(note => Popups.isVisible(note)) != -1)
            return null;

        //  Mini title bar.
        popup.classList.add("mini-title-bar");

        /*  Add event listeners to highlight citation when its footnote
            popup is hovered over.
         */
        popup.addEventListener("mouseenter", (event) => {
            target.classList.toggle("highlighted", true);
        });
        popup.addEventListener("mouseleave", (event) => {
            target.classList.toggle("highlighted", false);
        });
        GW.notificationCenter.addHandlerForEvent("Popups.popupWillDespawn", Extracts.footnotePopupDespawnHandler = (info) => {
            target.classList.toggle("highlighted", false);
        });

        return popup;
    },

    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_CITATION: (popFrame) => {
        let target = popFrame.spawningTarget;

		//	Remove back-link and self-link.
		popFrame.querySelector(".footnote-self-link").remove();
		popFrame.querySelector(".footnote-back").remove();

        //  Fire a contentDidLoad event.
        GW.notificationCenter.fireEvent("GW.contentDidLoad", {
            source: "Extracts.rewritePopFrameContent_CITATION",
            document: popFrame.contentView,
            location: Extracts.locationForTarget(target),
            flags: 0
        });
    },
}};

/*=---------------------=*/
/*= CITATIONS BACKLINKS =*/
/*=---------------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "CITATION_BACK_LINK",               // Type name
    "isCitationBackLink",               // Type predicate function
    null,                               // Target classes to add
    "citationBackLinkForTarget",        // Pop-frame fill function
    "citation-context"                  // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Called by: extracts.js (as `predicateFunctionName`)
    isCitationBackLink: (target) => {
        return target.classList.contains("footnote-back");
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    citationBackLinkForTarget: (target) => {
        GWLog("Extracts.citationBackLinkForTarget", "extracts-content.js", 2);

        return Extracts.localTranscludeForTarget(target, null, true);
    },

    /*  This “special testing function” is used to exclude certain targets which
        have already been categorized as (in this case) `CITATION_BACK_LINK`
        targets. It returns false if the target is to be excluded, true
        otherwise. Excluded targets will not spawn pop-frames.
     */
    //  Called by: extracts.js (as `testTarget_${targetTypeInfo.typeName}`)
    testTarget_CITATION_BACK_LINK: (target) => {
        return (Extracts.popFrameProvider != Popins);
    },

    //  Called by: extracts.js (as `preparePopup_${targetTypeName}`)
    preparePopup_CITATION_BACK_LINK: (popup) => {
        let target = popup.spawningTarget;

        //  Do not spawn citation context popup if citation is visible.
        let targetDocument = Extracts.targetDocument(target);
        if (   targetDocument
        	&& Popups.isVisible(targetDocument.querySelector(selectorFromHash(target.hash))))
            return null;

        //  Mini title bar.
        popup.classList.add("mini-title-bar");

        return popup;
    },

    //  Called by: extracts.js (as `rewritePopupContent_${targetTypeName}`)
    rewritePopupContent_CITATION_BACK_LINK: (popup) => {
        let target = popup.spawningTarget;

        //  Highlight citation in popup.
        /*  Remove the .targeted class from a targeted citation (if any)
            inside the popup (to prevent confusion with the citation that
            the spawning link points to, which will be highlighted).
         */
        popup.querySelectorAll(".footnote-ref.targeted").forEach(targetedCitation => {
            targetedCitation.classList.remove("targeted");
        });
        //  In the popup, the citation for which context is being shown.
        let citationInPopup = popup.querySelector(decodeURIComponent(target.hash));
        //  Highlight the citation.
        citationInPopup.classList.add("targeted");
        //  Scroll to the citation.
        requestAnimationFrame(() => {
            Extracts.popFrameProvider.scrollElementIntoViewInPopFrame(citationInPopup, popup);
        });

        //  Fire a contentDidLoad event.
        GW.notificationCenter.fireEvent("GW.contentDidLoad", {
            source: "Extracts.rewritePopupContent_CITATION_BACK_LINK",
            document: popup.contentView,
            location: Extracts.locationForTarget(target),
            flags: 0
        });
    }
}};

/*=---------------=*/
/*= REMOTE VIDEOS =*/
/*=---------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "VIDEO",                // Type name
    "isVideoLink",          // Type predicate function
    "has-content",          // Target classes to add
    "videoForTarget",       // Pop-frame fill function
    "video object"          // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    // Called by: Extracts.isVideoLink
    // Called by: Extracts.videoForTarget
    youtubeId: (href) => {
        let match = href.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        if (   match
            && match[2].length == 11) {
            return match[2];
        } else {
            return null;
        }
    },

    //  Called by: extracts.js (as `predicateFunctionName`)
    isVideoLink: (target) => {
        if (Extracts.isAnnotatedLink(target))
            return false;

        if ([ "www.youtube.com", "youtube.com", "youtu.be" ].includes(target.hostname)) {
            return (Extracts.youtubeId(target.href) != null);
        } else {
            return false;
        }
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    videoForTarget: (target) => {
        GWLog("Extracts.videoForTarget", "extracts-content.js", 2);

        let videoId = Extracts.youtubeId(target.href);
        let videoEmbedURL = `https://www.youtube.com/embed/${videoId}`;
        let placeholderImgSrc = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        let srcdocStyles = `<style>` +
            `* { padding: 0; margin: 0; overflow: hidden; }` +
            `html, body { height: 100%; } ` +
            `img, span { position: absolute; width: 100%; top: 0; bottom: 0; margin: auto; } ` +
            `span { height: 1.5em; text-align: center; font: 48px/1.5 sans-serif; color: white; text-shadow: 0 0 0.5em black; }` +
            `</style>`;
        let playButtonHTML = `<span class='video-embed-play-button'>&#x25BA;</span>`;
        let srcdocHTML = `<a href='${videoEmbedURL}?autoplay=1'><img src='${placeholderImgSrc}'>${playButtonHTML}</a>`;

        //  `allow-same-origin` only for EXTERNAL videos, NOT local videos!
        return Extracts.newDocument(
        	`<iframe 
        		src="${videoEmbedURL}" 
        		srcdoc="${srcdocStyles}${srcdocHTML}" 
        		frameborder="0" 
        		allowfullscreen 
        		sandbox="allow-scripts allow-same-origin"
        			></iframe>`);
    }
}};

/*=-----------------------=*/
/*= LOCALLY HOSTED VIDEOS =*/
/*=-----------------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "LOCAL_VIDEO",              // Type name
    "isLocalVideoLink",         // Type predicate function
    "has-content",              // Target classes to add
    "localVideoForTarget",      // Pop-frame fill function
    "video object"              // Pop-frame class
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Used in: Extracts.isLocalVideoLink
    videoFileExtensions: [ "mp4" ],

    // These variables appear to currently be unused. —SA, 2022-01-31
//  Extracts.videoMaxWidth = 634.0;
//  Extracts.videoMaxHeight = 474.0;

    //  Called by: extracts.js (as `predicateFunctionName`)
    isLocalVideoLink: (target) => {
        if (   target.hostname != location.hostname
            || Extracts.isAnnotatedLink(target))
            return false;

        let videoFileURLRegExp = new RegExp(
              '('
            + Extracts.videoFileExtensions.map(ext => `\\.${ext}`).join("|")
            + ')$'
        , 'i');
        return (target.pathname.match(videoFileURLRegExp) != null);
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    localVideoForTarget: (target) => {
        GWLog("Extracts.localVideoForTarget", "extracts-content.js", 2);

        return Extracts.newDocument(
        	  `<video controls="controls" preload="none">` 
        	+ `<source src="${target.href}">` 
        	+ `</video>`);
    },

    //  Called by: extracts.js (as `preparePopup_${targetTypeName}`)
    preparePopup_LOCAL_VIDEO: (popup) => {
        //  Mini title bar.
        popup.classList.add("mini-title-bar");

        return popup;
    },

    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_LOCAL_VIDEO: (popFrame) => {
        //  Loading spinner.
        Extracts.setLoadingSpinner(popFrame);
    }
}};

/*=-----------------------=*/
/*= LOCALLY HOSTED IMAGES =*/
/*=-----------------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "LOCAL_IMAGE",              // Type name
    "isLocalImageLink",         // Type predicate function
    "has-content",              // Target classes to add
    "localImageForTarget",      // Pop-frame fill function
    "image object"              // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Used in: Extracts.isLocalImageLink
    imageFileExtensions: [ "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg" ],

    //  Used in: Extracts.localImageForTarget
    imageMaxWidth: 634.0,
    imageMaxHeight: 474.0,

    //  Called by: extracts.js (as `predicateFunctionName`)
    isLocalImageLink: (target) => {
        if (   target.hostname != location.hostname
            || Extracts.isAnnotatedLink(target))
            return false;

        let imageFileURLRegExp = new RegExp(
              '('
            + Extracts.imageFileExtensions.map(ext => `\\.${ext}`).join("|")
            + ')$'
        , 'i');
        return (target.pathname.match(imageFileURLRegExp) != null);
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    localImageForTarget: (target) => {
        GWLog("Extracts.localImageForTarget", "extracts-content.js", 2);

        let width = target.dataset.imageWidth || 0;
        let height = target.dataset.imageHeight || 0;

        if (width > Extracts.imageMaxWidth) {
            height *= Extracts.imageMaxWidth / width;
            width = Extracts.imageMaxWidth;
        }
        if (height > Extracts.imageMaxHeight) {
            width *= Extracts.imageMaxHeight / height;
            height = Extracts.imageMaxHeight;
        }

        let styles = ``;
        if (   width > 0
            && height > 0)
            styles = `width="${width}" height="${height}" style="width: ${width}px; height: ${height}px;"`;

        //  Note that we pass in the original image-link’s classes - this is good for classes like ‘invertible’.
        return Extracts.newDocument(`<img 
        								${styles} 
        								class="${target.classList}" 
        								src="${target.href}" 
        								loading="lazy"
        									>`);
    },

    //  Called by: extracts.js (as `preparePopup_${targetTypeName}`)
    preparePopup_LOCAL_IMAGE: (popup) => {
        //  Mini title bar.
        popup.classList.add("mini-title-bar");

        return popup;
    },

    //  Called by: Extracts.rewritePopinContent_LOCAL_IMAGE
    //  Called by: Extracts.rewritePopupContent_LOCAL_IMAGE
    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_LOCAL_IMAGE: (popFrame) => {
        //  Remove extraneous classes from images in image pop-frames.
        popFrame.querySelector("img").classList.remove("has-annotation", "has-content", "link-self", "link-local");

        //  Loading spinner.
        Extracts.setLoadingSpinner(popFrame);
    },

    //  Called by: extracts.js (as `rewritePopupContent_${targetTypeName}`)
    rewritePopinContent_LOCAL_IMAGE: (popin) => {
        Extracts.rewritePopFrameContent_LOCAL_IMAGE(popin);

        //  Remove extraneous classes from images in image popins.
        popin.querySelector("img").classList.remove("spawns-popin");
    },

    //  Called by: extracts.js (as `rewritePopinContent_${targetTypeName}`)
    rewritePopupContent_LOCAL_IMAGE: (popup) => {
        Extracts.rewritePopFrameContent_LOCAL_IMAGE(popup);

        //  Remove extraneous classes from images in image popups.
        popup.querySelector("img").classList.remove("spawns-popup");

        if (popup.querySelector("img[width][height]"))
            popup.classList.add("dimensions-specified");
    },
}};

/*=--------------------------=*/
/*= LOCALLY HOSTED DOCUMENTS =*/
/*=--------------------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "LOCAL_DOCUMENT",               // Type name
    "isLocalDocumentLink",          // Type predicate function
    "has-content",                  // Target classes to add
    "localDocumentForTarget",       // Pop-frame fill function
    "local-document object"         // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Called by: extracts.js (as `predicateFunctionName`)
    isLocalDocumentLink: (target) => {
        if (   target.hostname != location.hostname
            || Extracts.isAnnotatedLink(target))
            return false;

        return (   target.pathname.startsWith("/docs/www/")
                || (   target.pathname.startsWith("/docs/")
                    && target.pathname.match(/\.(html|pdf)$/i) != null));
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    localDocumentForTarget: (target) => {
        GWLog("Extracts.localDocumentForTarget", "extracts-content.js", 2);

        if (target.href.match(/\.pdf(#|$)/) != null) {
            let data = target.href + (target.href.includes("#") ? "&" : "#") + "view=FitH";
            return Extracts.newDocument(`<object data="${data}"></object>`);
        } else {
            return Extracts.newDocument(`<iframe 
            								src="${target.href}" 
            								frameborder="0" 
            								sandbox="allow-same-origin" 
            								referrerpolicy="same-origin"
            									></iframe>`);
        }
    },

    /*  This “special testing function” is used to exclude certain targets which
        have already been categorized as (in this case) `LOCAL_DOCUMENT`
        targets. It returns false if the target is to be excluded, true
        otherwise. Excluded targets will not spawn pop-frames.
     */
    //  Called by: extracts.js (as `testTarget_${targetTypeInfo.typeName}`)
    testTarget_LOCAL_DOCUMENT: (target) => {
        return (!(   Extracts.popFrameProvider == Popins
                  && target.href.match(/\.pdf(#|$)/) != null));
    },

    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_LOCAL_DOCUMENT: (popFrame) => {
        //  Set title of popup from page title.
        let iframe = popFrame.querySelector("iframe");
        if (iframe) {
            iframe.addEventListener("load", (event) => {
                popFrame.titleBar.querySelector(".popframe-title-link").innerHTML = iframe.contentDocument.title;
            });
        }

        //  Loading spinner.
        Extracts.setLoadingSpinner(popFrame);
    }
}};

/*=---------------------------=*/
/*= LOCALLY HOSTED CODE FILES =*/
/*=---------------------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "LOCAL_CODE_FILE",              // Type name
    "isLocalCodeFileLink",          // Type predicate function
    "has-content",                  // Target classes to add
    "localCodeFileForTarget",       // Pop-frame fill function
    "local-code-file"               // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Used in: Extracts.isLocalCodeFileLink
    codeFileExtensions: [
        // truncated at 1000 lines for preview
        "bash", "c", "conf", "css", "csv", "diff", "hs", "html", "js", "json", "jsonl", "opml",
        "page", "patch", "php", "py", "R", "sh", "xml", "yaml",
        // Non-syntax highlighted (due to lack of known format), but truncated:
        "txt"
    ],

    //  Called by: extracts.js (as `predicateFunctionName`)
    isLocalCodeFileLink: (target) => {
        if (   target.hostname != location.hostname
            || Extracts.isAnnotatedLink(target))
            return false;

        if (Extracts.isAuxLinksLink(target))
            return false;

        let codeFileURLRegExp = new RegExp(
              '('
            + Extracts.codeFileExtensions.map(ext => `\\.${ext}`).join("|")
            + ')$'
        , 'i');
        return (target.pathname.match(codeFileURLRegExp) != null);
    },

    /*  We first try to retrieve a syntax-highlighted version of the given code
        file, stored on the server as an HTML fragment. If present, we embed
        that. If there’s no such fragment, then we just embed the contents of
        the actual code file, in a <pre>-wrapped <code> element.
     */
    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    localCodeFileForTarget: (target) => {
        GWLog("Extracts.localCodeFileForTarget", "extracts-content.js", 2);

        let setPopFrameContent = Extracts.popFrameProvider.setPopFrameContent;

        target.popFrame.classList.toggle("loading", true);
        doAjax({
            location: target.href + ".html",
            onSuccess: (event) => {
                if (!target.popFrame)
                    return;

                target.popFrame.classList.toggle("loading", false);
                setPopFrameContent(target.popFrame, Extracts.newDocument(event.target.responseText));

                //  Do additional rewriting, if any.
                if (Extracts.popFrameProvider == Popups)
                    Extracts.rewritePopupContent(target.popup);
                else // if (Extracts.popFrameProvider == Popins)
                    Extracts.rewritePopinContent(target.popin);
            },
            onFailure: (event) => {
                doAjax({
                    location: target.href,
                    onSuccess: (event) => {
                        if (!target.popFrame)
                            return;

                        target.popFrame.classList.toggle("loading", false);

                        let htmlEncodedResponse = event.target.responseText.replace(/[<>]/g, c => ('&#' + c.charCodeAt(0) + ';'));
                        let lines = htmlEncodedResponse.split("\n");
                        htmlEncodedResponse = lines.map(line => `<span class="line">${(line || "&nbsp;")}</span>`).join("\n");

                        setPopFrameContent(target.popFrame, 
                        	Extracts.newDocument(`<pre class="raw-code"><code>${htmlEncodedResponse}</code></pre>`));

                        //  Do additional rewriting, if any.
                        if (Extracts.popFrameProvider == Popups)
                            Extracts.rewritePopupContent(target.popup);
                        else // if (Extracts.popFrameProvider == Popins)
                            Extracts.rewritePopinContent(target.popin);
                    },
                    onFailure: (event) => {
                        if (!target.popFrame)
                            return;

                        target.popFrame.swapClasses([ "loading", "loading-failed" ], 1);
                    }
                });
            }
        });

        return Extracts.newDocument();
    },
}};

/*=----------------=*/
/*= OTHER WEBSITES =*/
/*=----------------=*/

Extracts.targetTypeDefinitions.insertBefore([
    "FOREIGN_SITE",             // Type name
    "isForeignSiteLink",        // Type predicate function
    "has-content",              // Target classes to add
    "foreignSiteForTarget",     // Pop-frame fill function
    "foreign-site object"       // Pop-frame classes
], (def => def[0] == "LOCAL_PAGE"));

Extracts = { ...Extracts, ...{
    //  Called by: extracts.js (as `predicateFunctionName`)
    isForeignSiteLink: (target) => {
        if (   target.hostname == location.hostname
            || Extracts.isAnnotatedLink(target))
            return false;

        return target.classList.contains("link-live");
    },

    //  Called by: extracts.js (as `popFrameFillFunctionName`)
    foreignSiteForTarget: (target) => {
        GWLog("Extracts.foreignSiteForTarget", "extracts-content.js", 2);

        let url = new URL(target.href);

        //  WARNING: EXPERIMENTAL FEATURE!
        if (localStorage.getItem("enable-embed-proxy") == "true") {
            let proxyURL = new URL("https://api.obormot.net/embed.php");

            doAjax({
                location: proxyURL.href,
                params: { url: url.href },
                onSuccess: (event) => {
                    if (!target.popFrame)
                        return;

                    let doc = document.createElement("div");
                    doc.innerHTML = event.target.responseText;
                    doc.querySelectorAll("[href], [src]").forEach(element => {
                        if (element.href) {
                            let elementURL = new URL(element.href);
                            if (   elementURL.host == location.host
                                && !element.getAttribute("href").startsWith("#")) {
                                elementURL.host = url.host;
                                element.href = elementURL.href;
                            }
                        } else if (element.src) {
                            let elementURL = new URL(element.src);
                            if (elementURL.host == location.host) {
                                elementURL.host = url.host;
                                element.src = elementURL.href;
                            }
                        }
                    });

                    if (event.target.getResponseHeader("content-type").startsWith("text/plain"))
                        doc.innerHTML = `<pre>${doc.innerHTML}</pre>`;

                    target.popFrame.querySelector("iframe").srcdoc = doc.innerHTML;

                    target.popFrame.classList.toggle("loading", false);
                },
                onFailure: (event) => {
                    if (!target.popFrame)
                        return;

                    target.popFrame.swapClasses([ "loading", "loading-failed" ], 1);
                }
            });

            return Extracts.newDocument(`<iframe frameborder="0" sandbox="allow-scripts allow-popups"></iframe>`);
        }
        //  END EXPERIMENTAL SECTION

        if ([ "www.lesswrong.com", "lesswrong.com", "www.greaterwrong.com", "greaterwrong.com" ].includes(url.hostname)) {
            //  Less Wrong
            url.protocol = "https:";
            url.hostname = "www.greaterwrong.com";
            url.search = "format=preview&theme=classic";
        } else if (   [ "www.alignmentforum.org", "alignmentforum.org" ].includes(url.hostname)
                   || (   [ "www.greaterwrong.com", "greaterwrong.com" ].includes(url.hostname)
                       && url.searchParams.get("view") == "alignment-forum")) {
            //  Alignment Forum
            url.protocol = "https:";
            url.hostname = "www.greaterwrong.com";
            url.search = "view=alignment-forum&format=preview&theme=classic";
        } else if ([ "forum.effectivealtruism.org", "ea.greaterwrong.com" ].includes(url.hostname)) {
            //  EA Forum
            url.protocol = "https:";
            url.hostname = "ea.greaterwrong.com";
            url.search = "format=preview&theme=classic";
        } else if ([ "arbital.com", "arbital.greaterwrong.com" ].includes(url.hostname)) {
            //  Arbital
            url.protocol = "https:";
            url.hostname = "arbital.greaterwrong.com";
            url.search = "format=preview&theme=classic";
        } else if (/(.+?)\.wikipedia\.org/.test(url.hostname) == true) {
            //  Wikipedia
            url.protocol = "https:";
            url.hostname = url.hostname.replace(/(.+?)(?:\.m)?\.wikipedia\.org/, "$1.m.wikipedia.org");
            if (!url.hash)
                url.hash = "#bodyContent";
        } else {
            url.protocol = "https:";
        }

        return Extracts.newDocument(`<iframe src="${url.href}" frameborder="0" sandbox></iframe>`);
    },

    //  Called by: extracts.js (as `rewritePopFrameContent_${targetTypeName}`)
    rewritePopFrameContent_FOREIGN_SITE: (popFrame) => {
        //  Loading spinner.
        Extracts.setLoadingSpinner(popFrame);
    }
}};
