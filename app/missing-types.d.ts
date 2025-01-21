// https://www.npmjs.com/package/pub-sub-es
declare module 'pub-sub-es' {
  // biome-ignore lint/suspicious/noExplicitAny: Inherited API
  type EventMap = { [name: string]: any };
  export type Subscription = {
    event: string;
    // biome-ignore lint/suspicious/noExplicitAny: Inherited API
    handler: (news: any) => void;
  };
  type PublishOptions = {
    async?: boolean;
    isNoGlobalBroadCast?: boolean;
  };
  export type PubSub = {
    // biome-ignore lint/suspicious/noExplicitAny: Inherited API
    publish(event: string, news?: any, options?: PublishOptions): void;
    // biome-ignore lint/suspicious/noExplicitAny: Inherited API
    subscribe(event: string, handler: (news: any) => void): Subscription;
    unsubscribe(subscription: Subscription): void;
    clear(): void;
  };
  export function createPubSub(): PubSub;
  export const globalPubSub: PubSub;
}
