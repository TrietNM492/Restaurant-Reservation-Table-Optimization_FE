import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, title = 'Are you sure?', children, onCancel, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger' }) {
  const confirmVariant = tone === 'danger' ? 'primary' : 'secondary';

  return (
    <Modal open={open} onClose={onCancel} title={title} className="ui-confirm-dialog" size="small">
      <div className="ui-modal__body" style={{ color: '#475569', lineHeight: 1.6 }}>{children}</div>
      <footer className="ui-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );
}