export function hasJsScript(path: string = '/', domain: string = ''): string {
    return `var _=new Date();_.setTime(_.getTime()+1e11);document.cookie='js=1;path=${path};${domain ? 'domain=' + domain + ';' : ''}expires='+_.toUTCString()`;
}
