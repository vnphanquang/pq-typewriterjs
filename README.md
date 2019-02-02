# Table of Contents
- [Table of Contents](#table-of-contents)

- [Changelog](#changelog)

- [What Is This? and Why Does It Even Exist?](#what-is-this-and-why-does-it-even-exist)

- [Steps](#steps)
  - [***Demo***](https://codepen.io/vnphanquang/pen/dwxjJE)
  - [CDN](#1-include-pq-typewriterjs-in-markup-header-locally-or-through-cdn)

- [Documentation](#documentation)
  - [Markup Restrictions & Recommendations](#markup-restrictions--recommendations)
  - [Commands](#command)
  - [Looping](#looping)
  - [Typewrtier Static Methods](#typewrtier-static-methods)
  - [Debugging Sheet](#debugging-sheet)

- [Bugs? Ideas?](#bugs-ideas)

- [Behind The Scenes](#behind-the-scenes)
  - [Sheet Construction - Typewriter `Feeding`](#sheet-construction---typewriter-feeding)
  - [Sheet Execution - Typewriter `Typing`](#sheet-execution---typewriter-typing)

# Changelog

2019.01.23
   - `feeding` no longer requires cursor argument. See [Typewriter Static Methods](#typewrtier-static-methods)
   - introduces `revert`. Animation can now be `typed` again after `reset`. See [`reset` or `revert`?](#reset-or-revert)
   - introduces `Loop` command, allows finite or infinte loop around a set of commands. See [Looping](#looping)


# What Is This? and Why Does It Even Exist?

Blah blah blah? See [Steps](#steps) and get right to it.

**pq-typewriterjs** (*pq*) is a small Javascript library that provides a solution to typing animation on the web. It employs ES6 class syntatic sugar with an object-oriented approach in mind.
****
There are plenty of solutions out there, and if you only need an one-time, single-line typing animation in pure CSS, this might not be for you. But read on, since *pq* offers some features that you might be looking for:

- Parameterization with [commands](#2-write-commands-in-markup) in HTML markup through comments (hence no interference with document flow),
- Multi-line dynamic typing, deleting, and [looping](#looping),
- User-customized styling for text, nested elements, and cursor with CSS,
- [Initiation](#4-initiate-in-javascript) with Javascript, integration with button click or other events,
- Vanila HTML, CSS, JS. No dependencies (no jQuery or external libraries),...

Wat da hell does dat mean? Basically:
- you tell what to type or delete, in how long, with HTML. 
- then you make everything fancy like you do with other HTMLElements, in CSS. 
- and finally you go to Javascript, tell *pq* to run this freaking animation for you.

With the combined use of HTML, CSS, JS, separation of concerns is ensured, extensibility and reusability made possible. 

Is this whole thing being overcomplicated? Probably YES!

# Steps

## 0. See a [***Demo***](https://codepen.io/vnphanquang/pen/dwxjJE)

## 1. Include *pq-typewriter.js* in markup header locally or through CDN

   ```HTML
   <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/vnphanquang/pq-typewriterjs/pq-typewriter.js"></script>
   ```

## 2. Write [*commands*](#command) in markup

Example: `<!--t, 5s, 200ms-->`, `<!--d, all, 5s, 200ms-->`, and `<!--l, infinite-->` as seen below

   ```HTML
   <pre id="typewriter"><!--t, 5s, 200ms-->wait for 200ms, <i>type this text</i> in 5s, wait for another 500ms, then <strong>delete everything</strong> in 3s<!--d, all, 3s, 500ms--><!--l,infinite--><span id="cursor"></span></pre>
   ```
[Documentation & Recommendations](#command)
   
## 3. Include CSS styles for *cursor element* and others as needed

Example: optionally, include `-o-`, `-webkit-`, and `-moz-` for cross-browser compatibility

   ```CSS
   #cursor::before {
      content: "|";
      color: transparent;
      background-color: orange;
      animation: blink-caret 0.8s ease infinite;
   }

   @keyframes blink-caret {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
   }
   ```

## 4. Initiate in Javascript

Example: invoke `Typewriter.feed()` and `Typewrtier.type()`, that's all

   ```Javascript
   const typewriter = document.getElementById("typewriter");
   var sheet = Typewriter.feed(typewriter); //<---feed as soon as possible
   //...
   Typewriter.type(sheet); //<-- type whenever ready
   ```
   More information: [Cautions](#typewrtier-static-methods), [`reset` or `revert`?](#reset-or-revert)

# Documentation

## Markup Restrictions & Recommendations

- See [looping](#looping) on how to use Loop command

- No text is allowed between between `delete command` and `type command`. For example:

   instead of
   ```HTML
   ...delete this text<!--d,all,3s,500ms-->!!!no text allowed here!!!<!--t, 5s-->then type this text...
   ```
   do
   ```HTML
   ...delete this text<!--d,all,3s,500ms--><!--t, 5s-->then type this...
   ```

- **Cursor** element should be put at the end of the parent element and should be empty, unless you want to use some content as the cursor. A `<span>` works well.

   ```HTML
   <p>.........<span id="cursor"></span></p>
   ```
   or
   ```HTML
   <p>.........<span id="cursor">your customized cursor</span></p>
   ```

- The `<pre>` tag is recommended for the **typewriter** element to honor line break in a multiline typing manner.

   ```HTML
   <pre>.......line break 
   is honored.......</pre>
   ```
   If wrapping is concerned, see CSS [white-space](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space), [word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break), and [overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap).

- ID identifiers for **typewriter** element and **cursor** element are up to you. But make sure to reflect them correctly in the script.

## Command

- ### Command Syntax


   |Command |Syntax                                         |Example                      |
   |---     |---                                            |---                          |
   |Type    |`<!--t, duration[, delay]-->{content}`         |`<--t, 2s, 500ms-->...`         |
   |Delete  |`{content}<!--d, target, duration[, delay]-->` |`...<--d, 42, 500ms, 200ms-->`  |
   |Loop    |`<!--l, count, delay-->`                       |`<!--l, infinite-->`            |

- ### Parameters

   |Command |Target                   |Count |Duration   |Delay (optional)         |Content|
   |:---:   |:---:                    |:---:      |:---:    |:---:           | :---:|
   |t       |                         ||`ms` or `s`|`ms` or `s`, 0 by default|some text after|
   |d       |`all`/`substring`/`count`||`ms` or `s`|`ms` or `s`, 0 by default|some text before|
   |l||`count`/`infinite`||`ms` or `s`, 0 by default|all other commands before
   

- ### Delete Target Options

   |Parameter|Example|Description|
   |---|---|---|
   |all|`<!--d, all, 5s-->`|deletes all text before this command|
   |substring|`<!--d, john dough, 5s, 2s-->`|deletes any text after the substring "`john dough`" (if multiple matches, first match counting from the right is honored)|
   |count|`<!--d, 42, 5s, 300ms-->`|deletes 42 characters, including whitespace and linebreak, counting from the right|

   [Markup Restriction for Type/Delete commands](#markup-restrictions--recommendations)

## Looping

A `Loop` command creates a number of iteration from itself around all other commands found before it in markup.

A `Loop` command must follow a `Delete` command: `type` something, `delete` what has just been typed, then do those again. If you need to type something twice in a row, do not use loop, simply include 2 consecutive `type` commands.

There are two scenarios when a `Loop` command is needed:

   1. ### Infinite `Loop` at the end of the command chain. Example:
      ```HTML
      <pre id="typewriter"><!--t, 5s, 200ms-->wait for 200ms, <i>type this text</i> in 5s, wait for another 500ms, then <strong>delete everything</strong> in 3s, then do everything again infinitely<!--d, all, 3s, 500ms--><!--l,infinite--><span id="cursor"></span></pre>
      ```

   2. ### Finite `Loop` somewhere in the command chain. Be cautious that in this case, a `Loop` must be followed by another command, no plain text is allowed. Example:

      do
      ```HTML
      <pre id="typewriter"><!--t, 1s, .5s-->type this, then delete that, and do those 3 times<!--d, all, 1s, .5s--><!--l, 3, .5s--><!--t, 1s, .5s--> then move on and type this...<span id="cursor"></span></pre>
      ```
      instead of
      ```HTML
      <pre id="typewriter"><!--t, 1s, .5s-->type this, then delete that, and do those 3 times<!--d, all, 1s, .5s--><!--l, 3, .5s--> then move on and type this<!--...--><span id="cursor"></span></pre>
      ```

## `Typewrtier` Static Methods

![Typewriter Method Infographics](/infographics/typewriter-static-methods.svg)

- ### How to Use it?

   |Method|Parameters|Return|
   |---|---|---|
   |`Typewriter.feed(<HTMLElement>)`|container `HTMLElement`|a `Sheet` object|
   |`Typewriter.type(<Sheet)`|a `Sheet` object|none|
   |`Typewriter.reset(<Sheet>)`|a `Sheet` object|none|
   |`Typewriter.revert(<Sheet>)`|a `Sheet` object|cursor `HTMLElement`|

   #### Cautions: 
   - Always capture the returned `Sheet` object to use it in `type`, `reset`, and `revert`.
      ```Javascript
      var sheet = Typewriter.feed(typewriter);
      // Typewriter.type(sheet);
      // Typewriter.reset(sheet)
      // Typewriter.revert(sheet)
      ```

   - Previously, a `sheet` can be typed only one time. With the latest implementation, `sheet` can be used again after `reset` without calling `feed` again.
      ```Javascript
      Typewriter.type(sheet);
      //...after animation has completed
      Typewriter.reset(sheet);
      //...some time later
      Typewriter.type(sheet);
      ```

   - #### `Reset` or `revert`? 
     - `Reset` will turn to the start of the animation (after `feed`) and pause. `Type` can be called to run the animation again.
     - `Revert` will turn to the inital state of the element (before `feed`). Be cautious that `revert` will remove **cursor** element. Call `revert` if you no longer wish to run the animation.

   - See [Looping](#looping) for instruction on how to use `Loop` Command

- ### What do they do?

   |Method|Description|
   |:---:|---|
   |`feed`|extracts and processes commands, deletes target contents, gets ready for animation|
   |`type`|initiates the animation process|
   |`reset`|resets and pause animation. Simply call `type` to start animation again|
   |`revert`|reverts innitial innerHTML, removes cursor, and returns cursor HTMLElement|

## Debugging `Sheet` 

   Call `.commandOverview()` to see details of all the extracted commands.
   ```Javascript
   var sheet = Typewriter.feed(typewriter);
   console.table(sheet.commandOverview());
   ```
   Note that delay and duration will be shown in milliseconds.

# Bugs? Ideas?

Please do let me know if you find a bug. Comment on codepen, open an issue on github, include stack trace & steps to get to the error, ... Anything is much appreciated.

Likewise, any contribution or idea is incredibly valuable. Thank you.

# What's coming next?

The following features will be implemented in the near future:

- Moving cursor left or  right during operation
- Pausing & Resuming animation

# Behind the Scenes

## Sheet Construction - Typewriter `Feeding`

The key concept that differs this project from other solutions is the construction of the `Sheet` object:

![Sheet construction](/infographics/sheet-construction.svg)

During `feeding`, **typewriter**'s [Child Nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes) are iterated:
- the **cursor** element is extracted into a `Cursor` object, pointed to by `Sheet.cursor`, and
- every [Text](https://developer.mozilla.org/en-US/docs/Web/API/Text) node is extracted into a `Target` object, added to `Sheet.targets`, and 
- every [Comment](https://developer.mozilla.org/en-US/docs/Web/API/Comment) node is extracted into a `Command` - `Type`, `Delete`, or `Loop` - added to `Sheet.commands`, making up a command chain.

## Sheet Execution - Typewriter `Typing`

After `feeding`:

![Sheet after feeding](/infographics/sheet-after-feeding.svg)

During `Typewriter typing`, `Sheet.commands` is iterated, each `Command` is executed in order, `Sheet.cursor` is updated accordingly. As seen below, the `Type` command and `Sheet.cursor` work together to render text to `Sheet.htmlElement`. The next `Delete` command works in a much similar way, but in reverse. If included, a [`Loop`](#looping) command will iterate all the previous commands.

![Sheet execution](/infographics/sheet-execution.svg)

