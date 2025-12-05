// Sistema de Notificações Toast - OD Drive

class NotificationSystem {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Criar container para toasts
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(options) {
    const {
      type = 'info', // success, error, warning, info
      title = '',
      message = '',
      duration = 4000,
      closable = true
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close" aria-label="Fechar">×</button>' : ''}
    `;

    this.container.appendChild(toast);

    // Close button
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.hide(toast));
    }

    // Auto-hide
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    return toast;
  }

  hide(toast) {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(title, message, duration) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title, message, duration) {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title, message, duration) {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title, message, duration) {
    return this.show({ type: 'info', title, message, duration });
  }
}

// Sistema de Modal Customizado
class ModalSystem {
  show(options) {
    const {
      title = 'Atenção',
      message = '',
      type = 'info', // confirm, alert
      confirmText = 'OK',
      cancelText = 'Cancelar',
      onConfirm = null,
      onCancel = null
    } = options;

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
          </div>
          <div class="modal-body">
            <p class="modal-text">${message}</p>
          </div>
          <div class="modal-footer">
            ${type === 'confirm' ? `<button class="btn btn-secondary btn-cancel">${cancelText}</button>` : ''}
            <button class="btn btn-primary btn-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const modal = overlay.querySelector('.modal');
      const btnConfirm = modal.querySelector('.btn-confirm');
      const btnCancel = modal.querySelector('.btn-cancel');

      const close = (result) => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(overlay);
          resolve(result);
        }, 200);
      };

      btnConfirm.addEventListener('click', () => {
        if (onConfirm) onConfirm();
        close(true);
      });

      if (btnCancel) {
        btnCancel.addEventListener('click', () => {
          if (onCancel) onCancel();
          close(false);
        });
      }

      // Fechar ao clicar fora
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          if (onCancel) onCancel();
          close(false);
        }
      });

      // Fechar com ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          if (onCancel) onCancel();
          close(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  alert(title, message) {
    return this.show({
      title,
      message,
      type: 'alert',
      confirmText: 'OK'
    });
  }

  confirm(title, message) {
    return this.show({
      title,
      message,
      type: 'confirm',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  }
}

// Instâncias globais
const notify = new NotificationSystem();
const modal = new ModalSystem();

// Expor globalmente
window.notify = notify;
window.modal = modal;
