declare module 'react-native-html-parser' {
  export class HTMLParser {
    static parse(html: string): any;
  }
  
  export interface Node {
    tagName: string;
    attributes: Record<string, string>;
    textContent: string;
    children: Node[];
  }
}
