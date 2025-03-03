const fakePubSub = {
  __fake__: true,
  publish: () => {},
  subscribe: () => ({
    event: '',
    handler: () => {},
  }),
  unsubscribe: () => {},
  clear: () => {},
};

export default fakePubSub;
