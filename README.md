# pq-typewriterjs
(to be updated soon)
A solution to web typing animation that ensures separation of concerns.

Demo: https://codepen.io/vnphanquang/pen/dwxjJE

Steps:
1. Include pq-typewriter.js in markup header:
CDN: <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/vnphanquang/pq-typewriterjs@master/pq-typewriter.js"></script>
or download pq-typewriter.js and include locally

2. Include commands in markup:
- Type command:         ...\<!--t, duration[, delay]-->content...
- Delete command:       ...\<!--d, target, duration[, delay]-->...

   where: duration & delay are numbers in milliseconds or seconds
            Ex: 500ms or 1s
          target can be one of the following:
               - count: the number of characters to be deleted
               - target: a substring that exists in the previous string
               - all: delete all previous content in this HTMLElement

3. Include an empty span element at the end of the HTMLElement for the cursor.

   Ex: 
        <pre id="typewriter">\<!--t, 1s-->this text\<!--d, all, 1s, 500ms--><span id="cursor"></span></pre> 
   will type "this text" in 1s, wait for 500ms, and delete everything in 1s.

4. Style in css: include any necessary style in CSS, including styles for cursor. See Demo above.

5. Initiate animation in JS:
   Ex: 
       const cursor = document.getElementById("cursor");
       const typewriter = document.getElementById("typewriter");
       
       var sheet = Typewriter.feed(typewriter, cursor); //<---expensive, feed as soon as possible
       Typewriter.type(sheet); //<---relatively inexpensive, type whenever ready
       Typewriter.reset(sheet); //<---pastes initial innerHTML to HTMLElement


