const fakePubSub = {
  __fake__: true,
  publish: () => { },
  subscribe: () => { },
  unsubscribe: () => { },
}

export default fakePubSub;
