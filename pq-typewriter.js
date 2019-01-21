'use strict';
//------------------- Command Class ------------------//
class Command {
   // sheet
   // content
   // duration
   // timeout
   // delay
   constructor(sheet, content, duration, delay) {
      this.sheet = sheet;
      this.content = content;
      this.duration = duration;
      this.timeout = duration / content.length;
      this.delay = delay;
   }

   execute() {
      throw new Error("Abstract Method: Implementation required");
   }

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
   constructor(sheet, content, duration, delay) {
      super(sheet, content, duration, delay);
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
   constructor(sheet, content, duration, delay) {
      super(sheet, content, duration, delay);
   }

   async execute() {
      let count = this.content.length;
      let cursor = this.sheet.cursor;
      let i = cursor.target.textNode.textContent.length;
      let end = cursor.targetIndex;
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
      start = cursor.targetIndex; //index of node being deleted

      //if whole target is deleted and target is not end target
      //then move to next target
      if (i != 0 && start + 1 != this.sheet.targets.length) {
         start++;
      }

      let deletedTargets = this.sheet.targets.splice(start, end - start + 1);

      //if there is still targets, move cursor to new target
      if (this.sheet.targets.length != 0) {
         cursor.toTarget(this.sheet.targets[start], start);
      }

      return deletedTargets;
   }
}
//------------------- Cursor Class ------------------//
class Cursor {
   // sheet
   // target
   // targetIndex
   // cursorElement
   // cursorPosition = 'end'
   constructor(sheet, target, targetIndex, cursorElement) {
      this.sheet = sheet;
      this.target = target;
      this.targetIndex = targetIndex;
      this.cursorElement = cursorElement;
      this.cursorPosition = 'end';
   }

   toNextTarget() {
      this.target = this.sheet.targets[++this.targetIndex];
      if (this.target == null) {
         return null;
      } else {
         return this.target;
      }
   }

   toPreviousTarget() {
      this.target = this.sheet.targets[--this.targetIndex];
      if (this.target == null) {
         return null;
      } else {
         return this.target;
      }
   }

   toTarget(newTarget, newTargetIndex) {
      this.target = newTarget;
      this.targetIndex = newTargetIndex;
   }

   render() { //inserts cursor before after this target (before next target)
      let nextTarget;
      let targets = this.sheet.targets;
      if (targets.length == this.targetIndex + 1) { //target is last node
         nextTarget == null;
         this.target.textNode.parentNode.insertBefore(this.cursorElement, nextTarget);
      } else {
         nextTarget = targets[this.targetIndex + 1].textNode;
         nextTarget.parentNode.insertBefore(this.cursorElement, nextTarget);
      }
   }

   // move() ?
}
//------------------- Target Classes ------------------//
class Target {
   // textNode
   // textContent
   constructor(textNode, textContent) {
      this.textNode = textNode;
      this.textContent = textContent;
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

   extract(node, commandContents, commandIndex) {
      let childNode;
      for (let i = 0; i < node.childNodes.length; i++) {
         childNode = node.childNodes[i];
         switch (childNode.nodeType) {
            case 1: //ELEMENT_NODE
               commandIndex = this.extract(childNode, commandContents, commandIndex); //to retain commandIndex value (essentially pass-by-reference)
               break;
            case 3: //TEXT_NODE
               this.targets.push(new Target(childNode, childNode.textContent));
               break;
            case 8: //COMMENT_NODE
               if (this.commands.length == 0) { //if there is untouched text before any commands
                  this.targetStartIndex = this.targets.length; //set target at first command
               }
               let paramsStr = childNode.textContent.trim();
               switch (paramsStr.charAt(0)) {
                  case "t":
                  case "T":
                     this.commands.push(this.extractTypeCommand(paramsStr, commandContents[commandIndex + 1]));
                     commandIndex += 2;
                     break;
                  case "d":
                  case "D":
                     this.commands.push(this.extractDeleteCommand(paramsStr));
                     commandIndex++;
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

   extractTypeCommand(paramsStr, contentStr) {
      let params = Sheet.extractChunks(paramsStr, /t\s*,\s*([0-9.]*\s*[ms]*)\s*,?\s*([0-9.]*\s*[ms]*)\s*/i);
      let duration = Sheet.extractTime(params[0]);
      let delay = (params.length == 2) ? Sheet.extractTime(params[1]) : 0;
      this.auditString += contentStr;
      this.estimatedDuration += duration + delay;
      return new Type(this, contentStr, duration, delay);
   }

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
      return new Delete(this, deleteContent, duration, delay);
   }

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

   async reset() {
      this.htmlElement.innerHTML = this.initialInnerHTML;
   }

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
   static async type(sheet) {
      await sheet.execute();
   }

   static feed(htmlElement, nodeElement) {
      return new Sheet(htmlElement, nodeElement);
   }

   static reset(sheet) {
      sheet.reset();
   }

   static sleep(ms) { //helper for command.execute()
      return new Promise(resolve => window.setTimeout(resolve, ms));
   }
}