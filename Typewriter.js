//------------------- Command Class ------------------//
class Command {
   // targetElement;
   // timeout;
   // delay = 0;
   // nextCommand = null;
   
   constructor(targetElement, timeout, delay, nextCommand) {
      this.targetElement = targetElement;
      this.delay = delay;
      this.nextCommand = nextCommand;
      this.timeout = timeout;
   }

   execute() {
      throw new Error("Abstract Method: Implementation required");
   }

   overview() {
      throw new Error("Abstract Method: Implementation required");
   }

}
//------------------- Type Classes ------------------//
class Type extends Command {
   // content;
   constructor(targetElement, timeout, delay, nextCommand, content) {
      super(targetElement, timeout, delay, nextCommand);
      this.content = content;
   }
   
   async execute() {
      for (let i = 0; i < this.content.length; i++) {
         await Typewriter.sleep(this.timeout);
         this.typeChar(this.content.charAt(i));
      }
      if (this.nextCommand != null) {
         await Typewriter.sleep(this.nextCommand.delay);
         this.nextCommand.execute();
      }
   }

   typeChar(char) {
      this.targetElement.innerHTML = this.targetElement.innerHTML + char;
   }

   overview() {
      return {command: "Type", 
      target: this.targetElement.tagName, 
      count: this.content.length, 
      timeout: Math.round(this.timeout), 
      duration: Math.round(this.timeout*this.content.length),
      delay: this.delay, content: this.content,
      'next command': this.nextCommand};
   }
}

class TypeTag extends Type {
   // tag;
   constructor(targetElement, timeout, delay, nextCommand, content, tag) {
      super(targetElement, timeout, delay, nextCommand, content);
      this.tag = tag;
   }

   execute() {
      let child = document.createElement(this.tag);
      this.targetElement = this.targetElement.insertAdjacentElement('beforeend', child);     
      super.execute();
   }

   overview() {
      let overview = super.overview();
      overview.command = "TypeTag";
      overview.target = this.tag;
      return overview;
   }
}
//------------------- Delete Classes ------------------//
class Delete extends Command {
   // content;
   constructor(targetElement, timeout, delay, nextCommand, content) {
      super(targetElement, timeout, delay, nextCommand);
      this.content = content;
   }

   async execute() {
      for (let i = 1; i <= this.content.length; i++) {
         await Typewriter.sleep(this.timeout);
         this.deleteChar();
      }
      if (this.nextCommand != null) {
         await Typewriter.sleep(this.nextCommand.delay);
         this.nextCommand.execute();
      }
      return new Promise(resolve => resolve());
   }

   deleteChar() {
      this.targetElement.innerHTML = this.targetElement.innerHTML.slice(0, -1);
   }

   overview() {
      return {command: "Delete", target: this.targetElement.tagName, count: this.content.length, timeout: Math.round(this.timeout), duration: Math.round(this.timeout*this.content.length), delay: this.delay, content: this.content, 'next command': this.nextCommand};
   }
}

class DeleteTag extends Delete {
   // tag;
   // childIndex;
   constructor(targetElement, timeout, delay, nextCommand, content, tag, childIndex) {
      super(targetElement, timeout, delay, nextCommand, content);
      this.tag = tag;
      this.childIndex = childIndex;
   }

   async execute() {
      let child = this.targetElement.children[this.childIndex - 1];
      this.targetElement = child;
      await super.execute();
      if (this.targetElement.textContent.length == 0) {
         this.targetElement.remove();
      }
   }

   overview() {
      let overview = super.overview();
      overview.command = "DeleteTag";
      overview.target = this.tag;
      overview.childIndex = this.childIndex;
      return overview;
   }
}
//------------------- Sheet Classes ------------------//
class Sheet {
   // commands;
   // container;
   // untouchedStr = undefined;
   constructor(container) {
      this.commands = [];
      this.container = container;
      this.untouchedStr = undefined;

      let innerHTML = this.container.innerHTML;
      this.deleteChildrenCounts = this.container.childElementCount;
      let commandChunks = innerHTML.split(/(<!--\s*[t,d]\s*,\s*\w*\s*,?\s*\d*\s*,?\s*\d*\s*-->)/i);

      let startPoint;
      if (!commandChunks[0].startsWith("<!--")) {
         startPoint = 1;
         this.untouchedStr = commandChunks[0];
      } else {
         startPoint = 0;
      }

      for (let i = commandChunks.length - 1; i >= startPoint; i--) {
         if (commandChunks[i] == "" || commandChunks[i] == undefined)
            continue;
         else {
            if (commandChunks[i].match(/<!--\s*t/i) != null) {
               this.extractTypeCommands(container, commandChunks[i], commandChunks[i+1]);
            } else if (commandChunks[i].match(/<!--\s*d/i) != null) {
               this.extractDeleteCommands(container, commandChunks[i], commandChunks[i-1]);
            }
         }
      }
   }
//-----------------------------------------------------------------//
   extractParameters(chunk, regex) {
      let params = [];
      let scatters = chunk.split(regex);
      for (let i = 0; i < scatters.length; i++) {
         if (scatters[i] != "" && scatters[i] != undefined) 
            params.push(scatters[i]);
      }
      return params;
   }

   extractTypeCommands(targetElement, commandStr, contentStr) {
      let params = this.extractParameters(commandStr, /<!--\s*t\s*,\s*(\d*)\s*,?\s*(\d*)\s*-->/i)
      let duration = params[0];
      let delay = (params.length == 2) ? params[1] : 0;
      
      let nestedChunks = contentStr.split(/(<[^>]*>[^<]*<\/[^>]*>)/);
      if (nestedChunks.length == 1) { //no tag inside
         let nextCommand = (this.commands.length ==  0) ? null : this.commands[this.commands.length - 1];    
         let newType = new Type(targetElement, duration/contentStr.length, delay, nextCommand, contentStr);
         this.commands.push(newType);
      } else { //tag inside
         let rawString = contentStr.replace(/<[^>]*>/g, "");
         let timeout = duration / rawString.length;
         let chunk;
         for (let i = nestedChunks.length - 1; i >= 0; i--) {
            chunk = nestedChunks[i];
            if (chunk == "" || chunk == undefined)
               continue;
            else {
               if (chunk.startsWith("<")) { //TypeTag
                  let tagParams = this.extractParameters(chunk, /<\s*(\w*)[^>]*>([^<]*)<\s*\/\s*\w*\s*>/);
                  let tag = tagParams[0];
                  let tagContent = (tagParams.length == 2) ? tagParams[1] : "";
                  let nextCommand = (this.commands.length ==  0) ? null : this.commands[this.commands.length - 1];    
                  let newTypeTag = new TypeTag(targetElement, timeout, 0, nextCommand, tagContent, tag);
                  this.commands.push(newTypeTag);
               } else {
                  let nextCommand = (this.commands.length ==  0) ? null : this.commands[this.commands.length - 1];    
                  let newType = new Type(targetElement, timeout, 0, nextCommand, chunk);
                  this.commands.push(newType);
               }
            }
         }
         this.commands[this.commands.length - 1].delay = parseInt(delay, 10);
      }

   }

   extractDeleteCommands(targetElement, commandStr, contentStr) {
      let params = this.extractParameters(commandStr, /<!--\s*d\s*,\s*(\w*)\s*,\s*(\d*)\s*,?\s*(\d*)\s*-->/i)
      let deleteTarget = params[0];
      let duration = params[1];
      let delay = (params.length == 3) ? params[2] : 0;
      
      let nestedChunks = contentStr.split(/(<[^>]*>[^<]*<\/[^>]*>)/);
      if (nestedChunks.length == 1) { //no tag inside
         let nextCommand = (this.commands.length == 0) ? null : this.commands[this.commands.length - 1];
         let content;
         if (deleteTarget == "all") {
            content = contentStr;
         } else if (/^\d+$/.test(deleteTarget)) {
            content = contentStr.slice(-deleteTarget);
         } else {
            content = contentStr.slice(contentStr.lastIndexOf(deleteTarget), contentStr);
         }
         let newDelete = new Delete(targetElement, duration/content, parseInt(delay, 10), nextCommand, content);
         this.commands.push(newDelete);
      } else { //tag inside
         let rawString = contentStr.replace(/<[^>]*>/g, "");
         let numberOfCharToDelete;
         if (deleteTarget == "all") {
            numberOfCharToDelete = rawString.length;
         } else if (/^\d+$/.test(deleteTarget)) {
            numberOfCharToDelete = deleteTarget;
         } else {
            numberOfCharToDelete = rawString.length - rawString.lastIndexOf(deleteTarget);
         }
         let timeout = duration / numberOfCharToDelete;
         
         let chunk;
         let newCommands = [];
         for (let i = nestedChunks.length - 1; i >= 0; i--) {
            chunk = nestedChunks[i];
            if (chunk == "" || chunk == undefined)
               continue;
            else {
               if (chunk.startsWith("<")) {//DeleteTag
                  let tagParams = this.extractParameters(chunk, /<\s*(\w*)[^>]*>([^<]*)<\s*\/\s*\w*\s*>/);
                  let tag = tagParams[0];
                  let tagContent = (tagParams.length == 2) ? tagParams[1] : 0;
                  // let nextCommand = (newCommands.length == 0) ? null : newCommands[newCommands.length - 1];
                  let content = (numberOfCharToDelete >= tagContent.length) ? tagContent : tagContent.slice(-numberOfCharToDelete);
                  let newDeleteTag = new DeleteTag(targetElement, timeout, 0, undefined, content, tag, this.deleteChildrenCounts - 1);
                  newCommands.push(newDeleteTag);

                  this.deleteChildrenCounts--;
                  numberOfCharToDelete = numberOfCharToDelete - content.length;
                  if (numberOfCharToDelete == 0)
                     break;
               } else { //Delete
                  // let nextCommand = (newCommands.length == 0) ? null : newCommands[newCommands.length - 1];
                  let content = (numberOfCharToDelete >= chunk.length) ? chunk : chunk.slice(-numberOfCharToDelete);
                  let newDelete = new Delete(targetElement, timeout, 0, undefined, content);
                  newCommands.push(newDelete);

                  numberOfCharToDelete = numberOfCharToDelete - content.length;
                  if (numberOfCharToDelete == 0)
                     break;
               }
            }
         }
         newCommands[0].delay = parseInt(delay, 10);
         newCommands[newCommands.length - 1].nextCommand = (this.commands.length == 0) ? null : this.commands[this.commands.length - 1];
         this.commands.push(newCommands[newCommands.length - 1]);
         for (let i = newCommands.length - 2; i >= 0; i--) {
            newCommands[i].nextCommand = newCommands[i + 1];
            this.commands.push(newCommands[i]);
         }
      }
   }
//-----------------------------------------------------------------// 
   async execute() {
      await Typewriter.sleep(this.commands[this.commands.length - 1].delay);
      this.commands[this.commands.length - 1].execute();
   }

   overview() {
      let commands = this.commands;
      let overview = [];
      for (let i = commands.length - 1; i >= 0; i--) {
         overview.push(commands[i].overview());
      }
      return overview;
   }

}
//------------------- Typewriter Class ------------------//
class Typewriter {
   static type(sheet) {
      sheet.container.innerHTML = sheet.untouchedStr;
      sheet.execute();
   }
   
   static feed(container) {
      return new Sheet(container);
   }
   static sleep(ms) {
      return new Promise(resolve => window.setTimeout(resolve, ms));
   }
}
