import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, title = 'Are you sure?', children, onCancel, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger' }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="ui-confirm-dialog">
      <div className="ui-modal__body">{children}</div>
      <footer className="ui-modal__footer">
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
      </footer>
    </Modal>
  );
}