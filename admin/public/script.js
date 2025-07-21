let currentPage = 1;
let totalPages = 1;

// Load initial data
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadMessages(1);
    
    // Auto-refresh every 30 seconds
    setInterval(refreshData, 30000);
    
    // Set up refresh button
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    
    // Set up page size change handler
    document.getElementById('pageSize').addEventListener('change', function() {
        loadMessages(1);
    });
    
    // Set up event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // Handle "Voir Détails" button
        if (e.target.closest('.btn-view-details')) {
            const messageId = e.target.closest('.btn-view-details').dataset.messageId;
            viewMessage(messageId);
        }
        
        // Handle "Marquer Lu" button
        if (e.target.closest('.btn-mark-read')) {
            const messageId = e.target.closest('.btn-mark-read').dataset.messageId;
            markAsRead(messageId);
        }
        
        // Handle "Supprimer" button
        if (e.target.closest('.btn-delete')) {
            const messageId = e.target.closest('.btn-delete').dataset.messageId;
            deleteMessage(messageId);
        }
        
        // Handle pagination links
        if (e.target.closest('.pagination-link')) {
            e.preventDefault();
            const page = parseInt(e.target.closest('.pagination-link').dataset.page);
            loadMessages(page);
        }
    });
});

function refreshData() {
    loadStats();
    loadMessages(currentPage);
}

function loadStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalMessages').textContent = data.total || 0;
            document.getElementById('unreadMessages').textContent = data.unread || 0;
            document.getElementById('todayMessages').textContent = data.today || 0;
            document.getElementById('weekMessages').textContent = data.week || 0;
            
            updateLastUpdate();
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

function loadMessages(page = 1) {
    const pageSize = document.getElementById('pageSize').value;
    
    fetch(`/api/messages?page=${page}&limit=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            currentPage = page;
            totalPages = data.totalPages;
            
            displayMessages(data.messages);
            updatePagination();
            updateLastUpdate();
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            document.getElementById('messagesContainer').innerHTML = 
                '<div class="alert alert-danger">Erreur lors du chargement des messages</div>';
        });
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Aucun message trouvé</div>';
        return;
    }
    
    const messagesHtml = messages.map(message => {
        const date = formatTimestamp(message.created_at);
        const unreadClass = message.read_status === 0 ? 'unread' : '';
        const unreadBadge = message.read_status === 0 ? 
            '<span class="badge bg-danger ms-2">Non lu</span>' : '';
        
        return `
            <div class="message-card ${unreadClass}">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1">
                            <i class="fas fa-user me-2"></i>
                            ${escapeHtml(message.name)}
                            ${unreadBadge}
                        </h6>
                        <small class="text-muted">
                            <i class="fas fa-envelope me-1"></i>
                            ${escapeHtml(message.email)}
                        </small>
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        ${date}
                    </small>
                </div>
                
                <div class="message-content">
                    <p class="mb-2">${escapeHtml(message.message)}</p>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        IP: ${message.ip_address || 'N/A'}
                    </small>
                    <div>
                        <button class="btn btn-sm btn-outline-primary btn-view-details" data-message-id="${message.id}">
                            <i class="fas fa-eye me-1"></i>
                            Voir Détails
                        </button>
                        ${message.read_status === 0 ? 
                            `<button class="btn btn-sm btn-outline-success ms-2 btn-mark-read" data-message-id="${message.id}">
                                <i class="fas fa-check me-1"></i>
                                Marquer Lu
                            </button>` : ''
                        }
                        <button class="btn btn-sm btn-outline-danger ms-2 btn-delete" data-message-id="${message.id}">
                            <i class="fas fa-trash me-1"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = messagesHtml;
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    let paginationHtml = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link pagination-link" href="#" data-page="${currentPage - 1}">Précédent</a>
            </li>
        `;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHtml += `
            <li class="page-item ${activeClass}">
                <a class="page-link pagination-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link pagination-link" href="#" data-page="${currentPage + 1}">Suivant</a>
            </li>
        `;
    }
    
    pagination.innerHTML = paginationHtml;
}

function updateLastUpdate() {
    const now = new Date().toLocaleTimeString('fr-FR');
    document.getElementById('lastUpdate').textContent = now;
}

function viewMessage(id) {
    console.log('viewMessage called with ID:', id);
    fetch(`/api/messages/${id}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(message => {
            console.log('Message data received:', message);
            const date = formatTimestamp(message.created_at);
            
            const modalHtml = `
                <div class="modal fade" id="messageModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Message de ${escapeHtml(message.name)}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>Nom:</strong> ${escapeHtml(message.name)}
                                    </div>
                                    <div class="col-md-6">
                                        <strong>Email:</strong> ${escapeHtml(message.email)}
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>Date:</strong> ${date}
                                    </div>
                                    <div class="col-md-6">
                                        <strong>IP:</strong> ${message.ip_address || 'N/A'}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <strong>Message:</strong>
                                    <div class="mt-2 p-3 bg-light rounded">
                                        ${escapeHtml(message.message)}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <strong>User Agent:</strong>
                                    <small class="text-muted">${escapeHtml(message.user_agent || 'N/A')}</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                <a href="mailto:${escapeHtml(message.email)}" class="btn btn-primary">
                                    <i class="fas fa-reply me-1"></i>
                                    Répondre
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('messageModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add new modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Show modal
            const modalElement = document.getElementById('messageModal');
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Bootstrap not loaded or Modal not available');
                // Fallback: show modal without Bootstrap
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                modalElement.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
            }
        })
        .catch(error => {
            console.error('Error loading message:', error);
            showNotification('Erreur lors du chargement du message', 'error');
        });
}

function markAsRead(id) {
    // Add loading state
    const button = document.querySelector(`[data-message-id="${id}"].btn-mark-read`);
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>En cours...';
    }
    
    fetch(`/api/messages/${id}/read`, {
        method: 'PUT'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            loadMessages(currentPage);
            loadStats();
            
            // Show success message
            showNotification('Message marqué comme lu', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error marking message as read:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
        
        // Reset button state
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check me-1"></i>Marquer Lu';
        }
    });
}

function showNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function deleteMessage(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) {
        return;
    }
    
    // Add loading state
    const button = document.querySelector(`[data-message-id="${id}"].btn-delete`);
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Suppression...';
    }
    
    fetch(`/api/messages/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            loadMessages(currentPage);
            loadStats();
            
            // Show success message
            showNotification('Message supprimé avec succès', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error deleting message:', error);
        showNotification('Erreur lors de la suppression', 'error');
        
        // Reset button state
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-trash me-1"></i>Supprimer';
        }
    });
}

function formatTimestamp(timestamp) {
    // SQLite CURRENT_TIMESTAMP is in UTC format like "2024-01-01 12:00:00"
    // We need to parse it as UTC and convert to local time
    let date;
    
    if (timestamp.includes('T')) {
        // Already in ISO format
        date = new Date(timestamp);
    } else {
        // SQLite format: "2024-01-01 12:00:00" - treat as UTC
        date = new Date(timestamp.replace(' ', 'T') + 'Z');
    }
    
    return date.toLocaleString('fr-FR');
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}