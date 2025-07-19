// js/ui/NotificationManager.js
// Notification system for user feedback

export class NotificationManager {
  constructor(app) {
    this.app = app;
  }

  // Notification Methods (moved from main.js)
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showWarning(message) {
    this.showNotification(message, 'warning');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };

    const state = this.app.stateManager.getState();
    state.ui.notifications.push(notification);
    this.renderNotification(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => this.removeNotification(notification.id), 5000);
  }

  renderNotification(notification) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.type}`;
    notificationEl.dataset.id = notification.id;
    
    notificationEl.innerHTML = `
      <span class="notification-message">${notification.message}</span>
      <button class="notification-close" onclick="app.notificationManager.removeNotification(${notification.id})">&times;</button>
    `;
    
    container.appendChild(notificationEl);
  }

  removeNotification(id) {
    const notificationEl = document.querySelector(`[data-id="${id}"]`);
    if (notificationEl) {
      notificationEl.remove();
    }
    
    const state = this.app.stateManager.getState();
    state.ui.notifications = state.ui.notifications.filter(n => n.id !== id);
  }
}

export default NotificationManager;