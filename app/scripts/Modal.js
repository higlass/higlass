import styles from '../styles/Modal.module.scss'; // eslint-disable-line no-unused-vars

const Modal = ({ handleClose, show, children }) => {
  const showHideStyleName = show
    ? 'modal-modal styles.display-block' : 'styles.modal-modal styles.display-none';

  return (
    <div styleName={showHideStyleName}>
      <section styleName="styles.modal-main">
        {children}
        <h1>Hi</h1>
        <button onClick={handleClose}>close</button>
      </section>
    </div>
  );
};

export default Modal;
