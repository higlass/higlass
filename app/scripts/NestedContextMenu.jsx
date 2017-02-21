import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';

export class NestedContextMenu extends ContextMenuContainer {
    constructor(props) {
        super(props);

        // console.log('props:', props);

    }

    getSubmenu() {
        if (this.state.submenuShown) {
            // the bounding box of the element which initiated the subMenu
            // necessary so that we can position the submenu next to the initiating
            // element
            let bbox = this.state.submenuSourceBbox;
            let position = null;

            if (this.state.orientation == 'left') {
               position = {
                    'left': this.state.left,
                    'top': bbox.top
                };
            } else {
                position = {
                    'left': this.state.left + bbox.width + 7,
                    'top': bbox.top
                }
            }


            let menuItem = this.state.submenuShown;

            return (<NestedContextMenu
                        position={position}
                        menuItems={menuItem.children}
                        orientation={this.state.orientation}
                        parentBbox={bbox}
                    />)
        } else {
            return (<div />);
        }
    }

    render() {
        let menuItems = [];

        // iterate over the list
        for (let menuItemKey in this.props.menuItems) {
            let menuItem = this.props.menuItems[menuItemKey];

            menuItems.push(<ContextMenuItem
                        key={menuItemKey}
                        onClick={menuItem.handler ? menuItem.handler : () => null}
                        onMouseEnter={menuItem.children ? e => this.handleItemMouseEnter(e, menuItem)
                                        : this.handleOtherMouseEnter.bind(this)}
                        onMouseLeave={this.handleMouseLeave}


                    >
                        {menuItem.name}
                        { menuItem.children ?
                            <svg
                                className = "play-icon"
                                width="10px"
                                height="10px">
                                <use xlinkHref="#play"></use>
                            </svg>
                            : null }
                    </ContextMenuItem>)
        }

        return( <div className={'context-menu'}
                        ref={c => this.div = c}
                        style={{
                                position: 'fixed',
                                left: this.state.left,
                                 top: this.state.top,
                                border: "1px solid black"
                              }}
                >

                    {menuItems}
                    {this.getSubmenu()}
                </div>)
    }
}
