import type { RequestInfo, Rule } from "../components/types";

// 定义后台消息的元数据类型
declare global {
  interface MessagesMetadata {
    getRequests: {
      response: RequestInfo[];
    };
    clearRequests: {
      response: void;
    };
    setDebugEnabled: {
      body: {
        enabled: boolean;
      };
      response: void;
    };
    getResponse: {
      body: {
        url: string;
      };
      response: {
        content: string;
      };
    };
    getResponseContent: {
      body: {
        url: string;
      };
      response: {
        content: string;
      };
    };
    toggleDebug: {
      body: {
        enabled: boolean;
      };
      response: void;
    };
    debugError: {
      body: {
        type: string;
        message: string;
      };
      response: void;
    };
  }
}

// 声明模块扩展
declare module "@plasmohq/messaging" {
  // 扩展sendToBackground函数的类型
  export function sendToBackground<K extends keyof MessagesMetadata>(
    message: {
      name: K;
      body?: MessagesMetadata[K] extends { body: infer B } ? B : never;
    }
  ): Promise<
    MessagesMetadata[K] extends { response: infer R } ? R : void
  >;
}
