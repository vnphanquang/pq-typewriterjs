'use strict';
//------------------- Command Class ------------------//
class Command {
   // sheet
   // commandIndex
   // content
   // duration
   // timeout
   // delay

   /**
    * @param {Sheet} sheet 
    * @param {number} commandIndex 
    * @param {string} content 
    * @param {number} duration in milliseconds
    * @param {number} delay in milliseconds
    */
   constructor(sheet, commandIndex, content, duration, delay) {
      this.sheet = sheet;
      this.commandIndex = commandIndex;
      this.delay = delay;
      if (! (this instanceof Loop)) {
         this.content = content;
         this.duration = duration;
         this.timeout = duration / content.length;
      }
   }

   /**
    * (Abstract Method. Implementation required)
    * executes this command
    */
   async execute() {
      throw new Error("Abstract Method: Implementation required");
   }

   /**
    * @returns {Object} a wrapper with information about this command
    */
   overview() {
      return {
         'command': this.constructor.name,
         'sheet': this.sheet,
         'count': this.count,
         'duration': this.duration,
         'delay': this.delay,
         'timeout': Math.round(this.timeout),
         'content': this.content,
      };
   }

}
//------------------- Loop Classes ------------------//
class Loop extends Command {
   // count
   // no content and duration
   
   /**
    * @param {Sheet} sheet 
    * @param {number} commandIndex 
    * @param {number} delay 
    * @param {number} count 
    */
   constructor(sheet, commandIndex, delay, count) {
      super(sheet, commandIndex, undefined, undefined, delay);
      this.count = count - 1 ; //minus the first run to get to this Loop command
      this.initialCount = count - 1; //for reset
   }

   async execute() {
      let i;
      let target;
      for (i = 0; i < this.sheet.targetStartIndex; i++) {
         target = this.sheet.targets[i];
         target.textNode.textContent = target.textContent;
         target.isRemoved = false;
      }
      for (i = this.sheet.targetStartIndex; i <= this.sheet.cursor.target.targetIndex; i++) {
         target = this.sheet.targets[i];
         target.textNode.textContent = "";
         target.isRemoved = false;
      }
      this.sheet.cursor.target = this.sheet.targets[this.sheet.targetStartIndex];
      if (this.count != Infinity) this.count--;
   }

   /**
    * resets loop count so that this command can be used again after Typewriter.reset()
    */
   resetCount() {
      this.count = this.initialCount;
   }

}
//------------------- Type Classes ------------------//
class Type extends Command {
   /**
    * @param {Sheet} sheet 
    * @param {number} commandIndex 
    * @param {string} content 
    * @param {number} duration in milliseconds
    * @param {number} delay in milliseconds
    */
   constructor(sheet, commandIndex, content, duration, delay) {
      super(sheet, commandIndex, content, duration, delay);
   }

   async execute() { //cursor.position == 'end'
      let count = this.content.length;
      let i = 0;
      let cursor = this.sheet.cursor;
      while (count > 0) {
         if (cursor.target.textNode.textContent.length == cursor.target.textContent.length) {
            cursor.toNextTarget();
            i = 0;
         }
         await Typewriter.sleep(this.timeout);
         cursor.target.textNode.textContent += cursor.target.textContent.charAt(i);

         i++;
         count--;
      }

   }
}

//------------------- Delete Classes ------------------//
class Delete extends Command {
   /**
    * @param {Sheet} sheet 
    * @param {number} commandIndex 
    * @param {string} content 
    * @param {number} duration in milliseconds
    * @param {number} delay in milliseconds
    */
   constructor(sheet, commandIndex, content, duration, delay) {
      super(sheet, commandIndex, content, duration, delay);
   }

   async execute() {
      let count = this.content.length;
      let cursor = this.sheet.cursor;
      let i = cursor.target.textNode.textContent.length;
      let end = cursor.target.targetIndex;
      let start;
      while (count > 0) {
         if (i == 0) {
            if (cursor.toPreviousTarget() == null) {
               break;
            }
            i = cursor.target.textNode.textContent.length;
         }
         await Typewriter.sleep(this.timeout);
         cursor.target.textNode.textContent = cursor.target.textNode.textContent.slice(0, -1);

         i--;
         count--;
      }
      start = cursor.target.targetIndex; //index of node being deleted
      
      let nextCommand = this.sheet.commands[this.commandIndex + 1];
      //if next command is loop, point to the end target (start of this command)
      if (nextCommand instanceof Loop && nextCommand.count > 0) {
         cursor.toTarget(this.sheet.targets[end]);
      } else {
         //if target still has content then point to next target
         if (i != 0) {
            start++;
         }
   
         for (let i = start; i <= end; i++) {
            this.sheet.targets[i].isRemoved = true;
         }
   
         //if next command is delete, point to previous target
         if (nextCommand instanceof Delete) {
            cursor.toTarget(this.sheet.targets[start - 1]);
         }
         //if next command is type & there is still targets, 
         //point to next (available) target
         else if (this.sheet.targets.length != 0) {
            cursor.toTarget(this.sheet.targets[end + 1]);
         }
      }
   }
}
//------------------- Cursor Class ------------------//
class Cursor {
   // sheet
   // target
   // targetIndex
   // cursorElement
   // cursorPosition = 'end'

   /**
    * @param {Sheet} sheet 
    * @param {Target} target 
    * @param {HTMLElement} cursorElement 
    */
   constructor(sheet, target, cursorElement) {
      this.sheet = sheet;
      this.target = target;
      this.cursorElement = cursorElement;
      this.cursorPosition = 'end';
   }

   /**
    * points cursor to next target in sheet's target lists
    * @returns {Target} next target
    * @returns {null} null if cursor's pointing to end of target list
    */
   toNextTarget() {
      let target = this.sheet.targets[this.target.targetIndex + 1];

      while(true) {
         if (target == null) {
            return null; //reaches end target
         } else {
            if (target.isRemoved == false) {
               this.target = target;
               return this.target;
            } else {
               target = this.sheet.targets[target.targetIndex + 1];
            }
         }
      }

   }

   /**
    * points cursor to previous target in sheet's target lists
    * @returns {Target} previous target
    * @returns {null} null if cursor's pointing to start of target list
    */
   toPreviousTarget() {
      let target = this.sheet.targets[this.target.targetIndex - 1];
      
      while(true) {
         if (target == null) {
            return null; //reaches start target
         } else {
            if (target.isRemoved == false) {
               this.target = target;
               return this.target;
            } else {
               target = this.sheet.targets[target.targetIndex - 1];
            }
         }
      }
   }

   /**
    * points cursor to new target
    * @param {Target} newTarget
    * @throws {Error} if new target is null or undefined
    */
   toTarget(newTarget) {
      this.target = newTarget;
   }

   // render() { //inserts cursor before after this target (before next target)
   //    let nextTarget;
   //    let targets = this.sheet.targets;
   //    if (targets.length == this.targetIndex + 1) { //target is last node
   //       nextTarget == null;
   //       this.target.textNode.parentNode.insertBefore(this.cursorElement, nextTarget);
   //    } else {
   //       nextTarget = targets[this.targetIndex + 1].textNode;
   //       nextTarget.parentNode.insertBefore(this.cursorElement, nextTarget);
   //    }
   // }

   // move() ?
}
//------------------- Target Classes ------------------//
class Target {
   // textNode
   // targetIndex
   // textContent
   // isRemoved

   /**
    * @param {HTMLElement} textNode 
    * @param {number} targetIndex 
    * @param {string} textContent 
    */
   constructor(textNode, targetIndex, textContent) {
      this.textNode = textNode;
      this.targetIndex = targetIndex;
      this.textContent = textContent;
      this.isRemoved = false;
   }
}
//------------------- Sheet Class ------------------// 
class Sheet {
   // htmlElement
   // initialInnerHTML
   // commands = []
   // targets = []
   // targetStartIndex
   // cursor
   // estimatedDuration

   /**
    * @param {HTMLElement} htmlElement container of the sheet
    */
   constructor(htmlElement) {
      this.commands = [];
      this.targets = [];
      this.htmlElement = htmlElement;
      this.initialInnerHTML = htmlElement.innerHTML;
      this.estimatedDuration = 0;

      this.auditString = "";
      let cursorElement = this.htmlElement.lastChild;
      cursorElement.remove();
      let commandContents = Sheet.extractChunks(this.initialInnerHTML.replace(/<[^!>]*>/g, ""), /(<!--[^>]*-->)/);
      let commandIndex = 0;

      if (!commandContents[commandIndex].startsWith("<!--")) {
         this.auditString += commandContents[commandIndex];
         commandIndex++;
      };
      this.extract(htmlElement, commandContents, commandIndex);

      for (let i = this.targetStartIndex; i < this.targets.length; i++) {
         this.targets[i].textNode.textContent = "";
      }
      this.cursor = new Cursor(this, this.targets[this.targetStartIndex], cursorElement);
      this.htmlElement.appendChild(cursorElement);

      delete this.auditString;
   }

   /**
    * helper for sheet constructor to extract targets & comments
    * @param {Node} node 
    * @param {Array} commandContents 
    * @param {number} commandIndex 
    */
   extract(node, commandContents, commandIndex) {
      let childNode;
      for (let i = 0; i < node.childNodes.length ; i++) {
         childNode = node.childNodes[i];
         switch (childNode.nodeType) {
            case 1: //ELEMENT_NODE
               commandIndex = this.extract(childNode, commandContents, commandIndex); //to retain commandIndex value (essentially pass-by-reference)
               break;
            case 3: //TEXT_NODE
               this.targets.push(new Target(childNode, this.targets.length, childNode.textContent));
               break;
            case 8: //COMMENT_NODE
               if (this.commands.length == 0) { //if there is untouched text before any commands
                  this.targetStartIndex = this.targets.length; //set target at first command
               }
               let paramsStr = childNode.textContent.trim();
               switch (paramsStr.charAt(0)) {
                  case "t":
                  case "T":
                     if (childNode.nextSibling == null || childNode.nextSibling.nodeType == 8) { //no text to type
                        throw new Error(`Command <${childNode.textContent}> has no target text to type.`);
                     } else {
                        this.commands.push(this.extractTypeCommand(paramsStr, commandContents[commandIndex + 1]));
                        commandIndex += 2;
                     }
                     break;
                  case "d":
                  case "D":
                     if (childNode.previousSibling == null) {
                        throw new Error(`Command <${childNode.textContent}> has no target text to delete.`);
                     } else {
                        this.commands.push(this.extractDeleteCommand(paramsStr));
                        commandIndex++;
                     }
                     break;
                  case "l":
                  case "L":
                     let loop = this.extractLoopCommand(paramsStr);
                     if (childNode.nextSibling != null && loop.count == Infinity) {
                        if (loop.count == Infinity) {
                           throw new Error(`Infinite Loop command must be place at the end of element.`);
                        } else if (childNode.nextSibling.nodeType != 8){
                           throw new Error(`Finite Loop command must be followed by another command.`);
                        }
                     } else if (childNode.previousSibling == null || childNode.previousSibling.nodeType != 8) {
                        throw new Error(`Loop command must follow a Delete command.`)
                     } else {
                        this.commands.push(loop);
                        commandIndex++;
                     break;
                     }
                  default:
                     throw new Error(`Command <${childNode.textContent}> is not supported by Typewriter.`);
               }
               break;
            default:
               throw new Error(`Node Type ${childNode.nodeType} is not supported by Typewriter.`);
         }
      }
      return commandIndex;
   }

   /**
    * helper for Sheet.extract() to extract Type command
    * @param {string} paramsStr 
    */
   extractLoopCommand(paramsStr) {
      let params = Sheet.extractChunks(paramsStr, /l\s*,\s*(\w*),?\s*([0-9.]*\s*[ms]*)\s*/i);
      let count = (params[0] == "infinite") ? Infinity : parseFloat(params[0]);
      let delay = (params.length == 2) ? Sheet.extractTime(params[1]) : 0;
      this.estimatedDuration = (count == Infinity) ? Infinity : ((this.estimatedDuration + delay) * count);
      return new Loop(this, this.commands.length, delay, count);
   }

   /**
    * helper for Sheet.extract() to extract Type command
    * @param {string} paramsStr string that contains parameters
    * @param {string} contentStr string that contains the target text
    * @returns {Type} a newly constructed Type command
    */
   extractTypeCommand(paramsStr, contentStr) {
      let params = Sheet.extractChunks(paramsStr, /t\s*,\s*([0-9.]*\s*[ms]*)\s*,?\s*([0-9.]*\s*[ms]*)\s*/i);
      let duration = Sheet.extractTime(params[0]);
      let delay = (params.length == 2) ? Sheet.extractTime(params[1]) : 0;
      this.auditString += contentStr;
      this.estimatedDuration += duration + delay;
      return new Type(this, this.commands.length, contentStr, duration, delay);
   }

   /**
    * helper for Sheet.extract() to extract Delete command
    * @param {string} paramsStr string that contains parameters
    * @returns {Delete} a newly constructed Delete command
    */
   extractDeleteCommand(paramsStr) {
      let params = Sheet.extractChunks(paramsStr, /d\s*,\s*([^,]*)\s*,\s*([0-9.]*\s*[ms]*)\s*,?\s*([0-9.]*\s*[ms]*)\s*/i);
      let duration = Sheet.extractTime(params[1]);
      let delay = (params.length == 3) ? Sheet.extractTime(params[2]) : 0;
      let targetParam = params[0];
      let deleteContent;
      if (targetParam == "all") {
         deleteContent = this.auditString;
         this.auditString = "";
      } else if (/^\d+$/.test(targetParam)) {
         let index = this.auditString.length - targetParam;
         deleteContent = this.auditString.slice(index);
         this.auditString = this.auditString.slice(0, index);
      } else {
         let index = this.auditString.lastIndexOf(targetParam);
         if (index == -1) {
            throw new Error(`Delete target ${targetParam} is not found.`)
         } else {
            deleteContent = this.auditString.slice(index);
            this.auditString = this.auditString.slice(0, index);
         }
      }
      this.estimatedDuration += duration + delay;
      return new Delete(this, this.commands.length, deleteContent, duration, delay);
   }

   /**
    * helper to extract chunk(s) from a string
    * @param {string} string string to extract from
    * @param {RegExp} regex regular expression needed for the extraction
    * @returns {Array} an array containing the extracted string chunk(s) 
    */
   static extractChunks(string, regex) {
      let extraction = string.split(regex);
      let chunks = [];
      let chunk;
      for (let i = 0; i < extraction.length; i++) {
         chunk = extraction[i];
         if (chunk != "" && chunk != undefined) {
            chunks.push(chunk);
         }
      }
      return chunks;
   }

   /**
    * helper to converts the time parameter to milliseconds when needed
    * @param {string} timeParam string containing the time parameter
    * @returns {number} (float) time in milliseconds
    */
   static extractTime(timeParam) { //if s, converts to ms
      let params = Sheet.extractChunks(timeParam, /([0-9.]*)\s*([ms]*)/i);
      let time = parseFloat(params[0]);
      switch (params[1]) {
         case "ms":
            break;
         case "s":
            time *= 1000;
            break;
         default:
            throw new Error(`Time parameter ${timeParam} is not supported by Typewriter.`);
      }
      return time;
   }
   //-------------------------------------------------------//
   /**
    * executes the command list from this sheet
    */
   async execute() {
      let command;
      let i = 0;
      do {
         command = this.commands[i];
         if (command instanceof Loop) {
            if (command.count > 0) {
               if (command.delay != 0) {
                  await Typewriter.sleep(command.delay);
               }
               await command.execute();
               i = 0;
            } else {
               command.resetCount();
               i++;
            }
         } else {
            if (command.delay != 0) {
               await Typewriter.sleep(command.delay);
            }
            await command.execute();
            i++;
         }
      } while (i < this.commands.length);
   }

   /**
    * revert to the initial state after feeding, ready to start animation again
    */
   reset() {
      let i;
      let target;
      for (i = 0; i < this.targetStartIndex; i++) {
         target = this.targets[i];
         target.textNode.textContent = target.textContent;
         target.isRemoved = false;
      }
      for (i = this.targetStartIndex; i < this.targets.length; i++) {
         target = this.targets[i];
         target.textNode.textContent = "";
         target.isRemoved = false;
      }
      this.cursor.target = this.targets[this.targetStartIndex];
   }
   
   /**
    * aborts this animation, revert to initial text
    */
   revert() {
      this.htmlElement.innerHTML = this.initialInnerHTML;
   }

   /**
    * @returns {Array} information about the command list
    */
   commandOverview() {
      let overview = [];
      for (let i = 0; i < this.commands.length; i++) {
         overview.push(this.commands[i].overview());
      }
      return overview;
   }

}
//------------------- Typewriter Class ------------------//
class Typewriter {
   /**
    * constructs a Sheet object containing information about the animation
    * @param {HTMLElement} htmlElement the container where the animation takes place
    */
   static feed(htmlElement) {
      return new Sheet(htmlElement);
   }

   /**
    * initiate the animation
    * @param {Sheet} sheet 
    */
   static async type(sheet) {
      await sheet.execute();
   }

   /**
    * reset and pause animation
    * call type to start animation again
    * @param {Sheet} sheet 
    */
   static reset(sheet) {
      sheet.reset();
   }

   /**
    * aborts this animation, revert to initial text
    */
   static revert(sheet) {
      sheet.revert();
      sheet.cursor.cursorElement.remove();
      return sheet.cursor.cursorElement;
   }
   /**
    * helper to span the right amount of time for the animation
    * (synchronous timeout)
    * @param {number} ms time in milliseconds
    */
   static sleep(ms) { //helper for command.execute()
      return new Promise(resolve => window.setTimeout(resolve, ms));
   }
}