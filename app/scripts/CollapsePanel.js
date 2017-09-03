/*jshint esnext: true */
import React from 'react';
import PropTypes from 'prop-types';
import { Panel, Collapse, Row } from 'react-bootstrap';
import {ControlLabel} from 'react-bootstrap';

export class CollapsePanel extends React.Component {
    render() {
        const { collapsed, toggleCollapse, name } = this.props
        const collapsedClass = (boolean) => {
            return boolean && 'collapsed';
        }
        return (
                <div>
                <ControlLabel><a
                        className={'collapse-toggle-icon ' + collapsedClass(collapsed)}
                        role="button"
                        onClick={() => toggleCollapse() }
                    >
                        {name}
                </a></ControlLabel>
                <Collapse in={!collapsed}>
                    <Panel>
                        {this.props.children}
                    </Panel>
                </Collapse>
                </div>
        );
    }
}

CollapsePanel.propTypes = {
    collapsed: PropTypes.bool.isRequired,
    toggleCollapse: PropTypes.func.isRequired,
    name: PropTypes.string
}

CollapsePanel.defaultProps = {
    name: 'Advanced Options'
}

export default CollapsePanel;
