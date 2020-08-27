/* jshint esnext: true */
import React from 'react';
import PropTypes from 'prop-types';
import { Collapse, ControlLabel, Panel } from 'react-bootstrap';

const CollapsePanel = (props) => (
  <div>
    <ControlLabel>
      <a
        className={`collapse-toggle-icon ${props.collapsedClass(
          props.collapsed,
        )}`}
        onClick={() => props.toggleCollapse()}
        role="button"
        tabIndex={0}
      >
        {props.name}
      </a>
    </ControlLabel>
    <Collapse in={!props.collapsed}>
      <Panel>{props.children}</Panel>
    </Collapse>
  </div>
);

CollapsePanel.propTypes = {
  children: PropTypes.node.isRequired,
  collapsed: PropTypes.bool.isRequired,
  collapsedClass: PropTypes.func.isRequired,
  toggleCollapse: PropTypes.func.isRequired,
  name: PropTypes.string,
};

CollapsePanel.defaultProps = {
  name: 'Advanced Options',
};

export default CollapsePanel;
