# pq-typewriterjs
(to be updated soon)
A solution to web typing animation that ensures separation of concerns.

Demo: https://codepen.io/vnphanquang/pen/dwxjJE

Steps:
1. Include CDN pq-typewriter.js in markup header, or download pq-typewriter.js and include locally

         <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/vnphanquang/pq-typewriterjs@master/pq-typewriter.js"></script>

2. Include commands in markup:
- Type command syntax:

      ...<!--t, duration[, delay]-->...
- Delete command syntax:

      ...<!--d, target, duration[, delay]-->...

where: 
- duration & delay are numbers in milliseconds or seconds. Delay is optional (zero by default).
Ex: 500ms or 1s
- target can be one of the following:
   - count: the number of characters to be deleted
   - target: a substring that exists in the previous string
   - all: delete all previous content in this HTMLElement
   
-  Caution: no text is allowed between two consecutive command strings. For example:

         ...<!--d,all,3s,500ms-->!!!no text allowed here!!!<!--t, 5s-->...

3. Include an empty span element at the end of the HTMLElement for the cursor. For example, to type "this text" in 1s, wait for 500ms, and delete everything in 1s:

       <pre id="typewriter"><!--t, 1s-->this text<!--d, all, 1s, 500ms--><span id="cursor"></span></pre> 
   

4. Style in css: include any necessary style in CSS, including styles for cursor. See Demo above.

5. Initiate animation in JS. For example:
   
       const cursor = document.getElementById("cursor");
       const typewriter = document.getElementById("typewriter");
       
       var sheet = Typewriter.feed(typewriter, cursor); //<---expensive, feed as soon as possible
       Typewriter.type(sheet); //<---relatively inexpensive, type whenever ready
       Typewriter.reset(sheet); //<---pastes initial innerHTML to HTMLElement


