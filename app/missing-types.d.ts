/* eslint-disable */
// https://www.npmjs.com/package/pub-sub-es
declare module 'pub-sub-es' {
  type EventMap = { [name: string]: any };
  export type Subscription = {
    event: string;
    handler: (news: any) => void;
  }
  type PublishOptions = {
    async?: boolean;
    isNoGlobalBroadCast?: boolean;
  }
  export type PubSub = {
    publish(event: string, news?: any, options?: PublishOptions): void;
    subscribe(event: string, handler: (news: any) => void): Subscription;
    unsubscribe(subscription: Subscription): void;
    clear(): void;
  }
  export function createPubSub(): PubSub;
  export const globalPubSub: PubSub;
}
