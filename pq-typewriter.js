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
      this.commandIndex = commandIndex;
      this.sheet = sheet;
      this.content = content;
      this.duration = duration;
      this.timeout = duration / content.length;
      this.delay = delay;
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
         'duration': this.duration,
         'delay': this.delay,
         'timeout': Math.round(this.timeout),
         'content': this.content
      };
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
               console.log(cursor.target.textNode.textContent);
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

      //if target still has content then point to next target
      if (i != 0) {
         start++;
      }
      for (let i = start; i <= end; i++) {
         this.sheet.targets[i].isRemoved = true;
      }

      //if next command is delete, point to previous target
      if (this.sheet.commands[this.commandIndex + 1] instanceof Delete) {
         cursor.toTarget(this.sheet.targets[start - 1]);
      }
      //if next command is type & there is still targets, 
      //point to next (available) target
      else if (this.sheet.targets.length != 0) {
         cursor.toTarget(this.sheet.targets[end + 1]);
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

      if (target.isRemoved == false) {
         if (target == null) {
            return null;
         } else {
            this.target = target;
            return this.target;
         }
      } else {
         return this.toNextTarget();
      }

   }

   /**
    * points cursor to previous target in sheet's target lists
    * @returns {Target} previous target
    * @returns {null} null if cursor's pointing to start of target list
    */
   toPreviousTarget() {
      let target = this.sheet.targets[this.target.targetIndex - 1];

      if (target.isRemoved == false) {
         if (target == null) {
            return null;
         } else {
            this.target = target;
            return this.target;
         }
      } else {
         return this.toPreviousTarget();
      }

   }

   /**
    * points cursor to new target
    * @param {Target} newTarget
    * @throws {Error} if new target is null or undefined
    */
   toTarget(newTarget) {
      if (newTarget == null || newTarget == undefined) {
         throw new Error(`${this} cannot be moved to a ${newTarget} target`)
      } else {
         this.target = newTarget;
      }
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
    * @param {HTMLElement} cursorElement element containing the cursor
    */
   constructor(htmlElement, cursorElement) {
      this.commands = [];
      this.targets = [];
      this.htmlElement = htmlElement;
      this.initialInnerHTML = htmlElement.innerHTML;
      this.estimatedDuration = 0;

      this.auditString = "";

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
      this.cursor = new Cursor(this, this.targets[this.targetStartIndex], this.targetStartIndex, cursorElement);

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
      for (let i = 0; i < node.childNodes.length; i++) {
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
                     if (childNode.nextSibling.textContent == "" || childNode.nextSibling.nodeType == 8) { //no text to type
                        throw new Error(`Command ${childNode.textContent} has no target text to type`);
                     } else {
                        this.commands.push(this.extractTypeCommand(paramsStr, commandContents[commandIndex + 1]));
                        commandIndex += 2;
                     }
                     break;
                  case "d":
                  case "D":
                     if (childNode.previousSibling == null) {
                        throw new Error(`Command ${childNode.textContent} has no target text to delete`);
                     } else {
                        this.commands.push(this.extractDeleteCommand(paramsStr));
                        commandIndex++;
                     }
                     break;
                  default:
                     throw new Error(`Command ${childNode.textContent} is not supported by Typewriter.`);
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
      for (let i = 0; i < this.commands.length; i++) {
         command = this.commands[i];
         if (command.delay != 0) {
            await Typewriter.sleep(command.delay);
         }
         await command.execute();
      }
   }

   /**
    * 
    */
   async reset() {
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
    * @param {HTMLElement} cursorElement the element that contains the cursor
    */
   static feed(htmlElement, cursorElement) {
      return new Sheet(htmlElement, cursorElement);
   }

   /**
    * initiate the animation
    * @param {Sheet} sheet 
    */
   static async type(sheet) {
      await sheet.execute();
   }

   /**
    * 
    * @param {Sheet} sheet 
    */
   static reset(sheet) {
      sheet.reset();
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