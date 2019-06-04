import PropTypes from 'prop-types';
import React from 'react';
import {
  useMenuState,
  Menu,
  MenuDisclosure,
  MenuItem,
} from 'reakit/Menu';

const handleClick = (closeOnClick, handler, hide) => (e) => {
  if (closeOnClick) hide();
  handler(e);
};

const DropDownMenu = React.forwardRef((props, ref) => {
  const menu = useMenuState();
  return (
    <div>
      <MenuDisclosure
        ref={ref}
        {...menu}
        className={props.classNameDisclosure}
      >
        {props.disclosureLabel}
      </MenuDisclosure>
      <Menu
        {...menu}
        aria-label={props.menuLabel}
        className={props.classNameMenu}
        onMouseMove={props.onMouseMove}
      >
        {props.menuItems.map(item => (
          <MenuItem
            key={item.key}
            {...item.props}
            {...menu}
            className={props.classNameMenuItem}
            onClick={handleClick(
              props.closeOnClick, item.props.onClick, menu.hide
            )}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
});

DropDownMenu.defaultProps = {
  classNameDisclosure: '',
  classNameMenu: '',
  classNameMenuItem: '',
  closeOnClick: false,
  id: '',
  onMouseMove: null
};

DropDownMenu.propTypes = {
  children: PropTypes.node.isRequired,
  classNameDisclosure: PropTypes.string,
  classNameMenu: PropTypes.string,
  classNameMenuItem: PropTypes.string,
  closeOnClick: PropTypes.bool,
  disclosureLabel: PropTypes.string.isRequired,
  id: PropTypes.string,
  menuLabel: PropTypes.string.isRequired,
  onMouseMove: PropTypes.func,
};

export default DropDownMenu;
