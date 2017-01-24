import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';

export class NestedContextMenu extends ContextMenuContainer {
    constructor(props) {
        super(props);
        
        console.log('props:', props);

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

            
            let track = this.state.submenuShown;

            console.log('track:', track);

            for (let optionType in track.options) {
                if (optionsInfo.hasOwnProperty(optionType)) {
                   console.log('oi:', optionsInfo);
                }
            }

        } else {
            return (<div />);
        }
    }

    render() {
        let menuItems = [];
        console.log('menuItems:', menuItems);

        // iterate over the list 
        for (let menuItemKey in this.props.menuItems) {
            let menuItem = this.props.menuItems[menuItemKey];

            console.log('menuItem:', menuItem);
            menuItems.push(<ContextMenuItem
                        key={menuItemKey}
                    >
                        {menuItem.name}   
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

                </div>)
    }
}
