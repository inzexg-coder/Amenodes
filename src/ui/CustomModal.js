export class CustomModal {
  constructor() {
    this.modal = null;
    this.createStyles();
  }

  createStyles() {
    if (document.getElementById('custom-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'custom-modal-styles';
    style.textContent = `
      .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
      }
      
      .custom-modal {
        background: linear-gradient(135deg, #1a1f30, #0f1222);
        border-radius: 20px;
        border: 1px solid #ffcd7e;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        width: 400px;
        max-width: 90%;
        overflow: hidden;
        animation: modalSlideIn 0.2s ease;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .custom-modal-header {
        padding: 16px 20px;
        background: #2a3a5e;
        font-weight: bold;
        font-size: 16px;
        color: #ffefcf;
        border-bottom: 1px solid #ffcd7e50;
      }
      
      .custom-modal-body {
        padding: 24px 20px;
        color: #eef2ff;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .custom-modal-input {
        width: 100%;
        padding: 10px 12px;
        margin-top: 12px;
        background: #0f1222;
        border: 1px solid #4a6a8a;
        border-radius: 10px;
        color: #ffefcf;
        font-family: monospace;
        font-size: 14px;
        outline: none;
      }
      
      .custom-modal-input:focus {
        border-color: #ffcd7e;
        box-shadow: 0 0 8px rgba(255, 205, 126, 0.3);
      }
      
      .custom-modal-buttons {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        background: #0a0c14;
        border-top: 1px solid #2e385c;
      }
      
      .custom-modal-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 40px;
        font-weight: bold;
        cursor: pointer;
        font-family: monospace;
        transition: all 0.1s;
      }
      
      .custom-modal-btn-primary {
        background: #ffb347;
        color: #1a1f30;
      }
      
      .custom-modal-btn-primary:hover {
        background: #ffcc66;
        transform: scale(1.02);
      }
      
      .custom-modal-btn-secondary {
        background: #2d3a5e;
        color: #eef2ff;
      }
      
      .custom-modal-btn-secondary:hover {
        background: #3f4e7a;
      }
      
      .custom-modal-btn-danger {
        background: #8b3a3a;
        color: #ffcccc;
      }
      
      .custom-modal-btn-danger:hover {
        background: #aa4a4a;
      }
    `;
    document.head.appendChild(style);
  }

  alert(message, title = 'Notification') {
    return new Promise((resolve) => {
      this.showModal({
        title,
        body: message,
        buttons: [{ text: 'OK', type: 'primary', callback: resolve }]
      });
    });
  }

  confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      this.showModal({
        title,
        body: message,
        buttons: [
          { text: 'Cancel', type: 'secondary', callback: () => resolve(false) },
          { text: 'OK', type: 'danger', callback: () => resolve(true) }
        ]
      });
    });
  }

  prompt(message, defaultValue = '', title = 'Enter Value') {
    return new Promise((resolve) => {
      let inputValue = defaultValue;
      
      const body = document.createElement('div');
      body.textContent = message;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.className = 'custom-modal-input';
      input.placeholder = 'Enter value...';
      
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          resolve(inputValue);
          this.close();
        }
      };
      
      body.appendChild(input);
      
      this.showModal({
        title,
        bodyElement: body,
        onShow: () => input.focus(),
        buttons: [
          { text: 'Cancel', type: 'secondary', callback: () => resolve(null) },
          { text: 'OK', type: 'primary', callback: () => {
            inputValue = input.value;
            resolve(inputValue);
          }}
        ]
      });
    });
  }

  showModal(options) {
    this.close();
    
    const { title, body, bodyElement, buttons, onShow } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    
    const header = document.createElement('div');
    header.className = 'custom-modal-header';
    header.textContent = title;
    
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'custom-modal-body';
    
    if (bodyElement) {
      bodyDiv.appendChild(bodyElement);
    } else if (body) {
      bodyDiv.textContent = body;
    }
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'custom-modal-buttons';
    
    for (const btn of buttons) {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.className = `custom-modal-btn custom-modal-btn-${btn.type}`;
      button.onclick = () => {
        if (btn.callback) btn.callback();
        this.close();
      };
      buttonsDiv.appendChild(button);
    }
    
    modal.appendChild(header);
    modal.appendChild(bodyDiv);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    
    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };
    
    document.body.appendChild(overlay);
    this.modal = overlay;
    
    if (onShow) setTimeout(onShow, 10);
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

export const modal = new CustomModal();
