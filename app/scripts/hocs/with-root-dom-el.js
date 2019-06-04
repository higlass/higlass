import React from 'react';

import toVoid from '../utils/to-void';

const { Provider, Consumer } = React.createContext({ get: toVoid });

// Higher order component
const withRootDomEl = Component => React.forwardRef((props, ref) => (
  <Consumer>
    {rootDomEl => <Component ref={ref} {...props} rootDomEl={rootDomEl} />}
  </Consumer>
));

export default withRootDomEl;

export { Provider };
