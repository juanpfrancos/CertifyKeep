// Global variables
let certificatesData = [];
let currentSortMethod = 'date';
let allExpanded = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize application
async function initializeApp() {
    // Load dark mode preference
    loadDarkModePreference();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load certificates data
    await loadCertificates();
}

// Load dark mode preference from localStorage
function loadDarkModePreference() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
    
    // Sort buttons
    document.getElementById('sortByDate').addEventListener('click', () => sortCertificates('date'));
    document.getElementById('sortByInstitution').addEventListener('click', () => sortCertificates('institution'));
    document.getElementById('sortByTitle').addEventListener('click', () => sortCertificates('title'));
    
    // Toggle all accordion
    document.getElementById('toggleAllBtn').addEventListener('click', toggleAllAccordions);
}

// Toggle dark mode
function toggleDarkMode(event) {
    const theme = event.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Load certificates from JSON
async function loadCertificates() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const response = await fetch('data/certificados.json');
        
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo JSON');
        }
        
        certificatesData = await response.json();
        
        if (certificatesData.length === 0) {
            loadingSpinner.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }
        
        // Sort by date initially (most recent first)
        certificatesData.sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return dateB - dateA;
        });
        
        // Mark the date button as active by default
        document.getElementById('sortByDate').classList.add('active');
        
        // Update total counter
        updateTotalCounter();
        
        // Render certificates
        renderCertificates();
        
        // Hide loading spinner
        loadingSpinner.classList.add('d-none');
        
    } catch (error) {
        console.error('Error al cargar certificados:', error);
        loadingSpinner.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al cargar los certificados. Por favor, verifica que el archivo 'data/certificados.json' exista.
            </div>
        `;
    }
}

// Update total counter
function updateTotalCounter() {
    const totalCounter = document.getElementById('totalCounter');
    totalCounter.textContent = certificatesData.length;
}

// Group certificates by category
function groupByCategory(certificates) {
    return certificates.reduce((acc, cert) => {
        const category = cert.categoria;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(cert);
        return acc;
    }, {});
}

// Render certificates
function renderCertificates() {
    const accordion = document.getElementById('certificatesAccordion');
    accordion.innerHTML = '';
    
    const groupedCerts = groupByCategory(certificatesData);
    const categories = Object.keys(groupedCerts).sort((a, b) => a.localeCompare(b));
    
    categories.forEach((category, index) => {
        const categoryId = `category-${index}`;
        const certificates = groupedCerts[category];
        
        const accordionItem = createAccordionItem(category, categoryId, certificates, index);
        accordion.appendChild(accordionItem);
    });
    
    // Restore expanded/collapsed state after rendering
    updateAccordionState();
}

// Create accordion item for a category
function createAccordionItem(category, categoryId, certificates, index) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    
    const header = document.createElement('h2');
    header.className = 'accordion-header';
    header.id = `heading-${categoryId}`;
    
    const button = document.createElement('button');
    button.className = `accordion-button ${index === 0 ? '' : 'collapsed'}`;
    button.type = 'button';
    button.setAttribute('data-bs-toggle', 'collapse');
    button.setAttribute('data-bs-target', `#collapse-${categoryId}`);
    button.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', `collapse-${categoryId}`);
    
    button.innerHTML = `
        <i class="bi bi-folder-fill me-2"></i>
        ${category}
        <span class="category-badge">${certificates.length}</span>
    `;
    
    header.appendChild(button);
    
    const collapse = document.createElement('div');
    collapse.id = `collapse-${categoryId}`;
    collapse.className = `accordion-collapse collapse ${index === 0 ? 'show' : ''}`;
    collapse.setAttribute('aria-labelledby', `heading-${categoryId}`);
    collapse.setAttribute('data-bs-parent', '#certificatesAccordion');
    
    const body = document.createElement('div');
    body.className = 'accordion-body';
    
    const grid = document.createElement('div');
    grid.className = 'certificates-grid';
    
    certificates.forEach(cert => {
        const card = createCertificateCard(cert);
        grid.appendChild(card);
    });
    
    body.appendChild(grid);
    collapse.appendChild(body);
    
    item.appendChild(header);
    item.appendChild(collapse);
    
    return item;
}

// Create certificate card
function createCertificateCard(cert) {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    card.setAttribute('data-aos', 'fade-up');
    
    // Format date
    const formattedDate = formatDate(cert.fecha);
    
    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image-container';
    
    if (cert.imagen && cert.imagen.trim() !== '') {
        const img = document.createElement('img');
        img.src = cert.imagen;
        img.alt = cert.titulo;
        img.loading = 'lazy';
        
        // Handle image load
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });
        
        // Handle image error
        img.addEventListener('error', function() {
            this.parentElement.innerHTML = '<i class="bi bi-file-earmark-pdf-fill card-image-placeholder"></i>';
        });
        
        imageContainer.appendChild(img);
    } else {
        imageContainer.innerHTML = '<i class="bi bi-file-earmark-pdf-fill card-image-placeholder"></i>';
    }
    
    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.innerHTML = `
        <h5 class="card-title">${cert.titulo}</h5>
        <p class="card-institution">
            <i class="bi bi-building"></i>
            ${cert.institucion}
        </p>
        <p class="card-date">
            <i class="bi bi-calendar3"></i>
            ${formattedDate}
        </p>
    `;
    
    // Card footer
    const cardFooter = document.createElement('div');
    cardFooter.className = 'card-footer-custom';
    cardFooter.innerHTML = `
        <span class="view-pdf-btn">
            Ver certificado
            <i class="bi bi-arrow-right"></i>
        </span>
    `;
    
    // Add click event
    card.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(cert.url, '_blank');
    });
    
    card.appendChild(imageContainer);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    
    return card;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    return date.toLocaleDateString('es-ES', options);
}

// Sort certificates
function sortCertificates(method) {
    // Prevent re-sorting if the same method is clicked
    if (currentSortMethod === method) {
        return;
    }
    
    currentSortMethod = method;
    
    // Update active button
    document.querySelectorAll('.btn-outline-primary').forEach(btn => {
        btn.classList.remove('active');
    });
    
    switch(method) {
        case 'date':
            document.getElementById('sortByDate').classList.add('active');
            certificatesData.sort((a, b) => {
                const dateA = new Date(a.fecha);
                const dateB = new Date(b.fecha);
                return dateB - dateA; // Most recent first
            });
            break;
        case 'institution':
            document.getElementById('sortByInstitution').classList.add('active');
            certificatesData.sort((a, b) => a.institucion.localeCompare(b.institucion));
            break;
        case 'title':
            document.getElementById('sortByTitle').classList.add('active');
            certificatesData.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
    }
    
    renderCertificates();
}

// Toggle all accordions
function toggleAllAccordions() {
    const toggleBtn = document.getElementById('toggleAllBtn');
    const accordionButtons = document.querySelectorAll('.accordion-button');
    const accordionCollapses = document.querySelectorAll('.accordion-collapse');
    
    allExpanded = !allExpanded;
    
    if (allExpanded) {
        // Expand all
        accordionButtons.forEach(btn => {
            btn.classList.remove('collapsed');
            btn.setAttribute('aria-expanded', 'true');
        });
        
        accordionCollapses.forEach(collapse => {
            collapse.classList.add('show');
        });
        
        toggleBtn.innerHTML = '<i class="bi bi-arrows-collapse me-1"></i> Contraer Todos';
    } else {
        // Collapse all
        accordionButtons.forEach(btn => {
            btn.classList.add('collapsed');
            btn.setAttribute('aria-expanded', 'false');
        });
        
        accordionCollapses.forEach(collapse => {
            collapse.classList.remove('show');
        });
        
        toggleBtn.innerHTML = '<i class="bi bi-arrows-expand me-1"></i> Ver Todos';
    }
}

// Update accordion state after rendering
function updateAccordionState() {
    const toggleBtn = document.getElementById('toggleAllBtn');
    const accordionButtons = document.querySelectorAll('.accordion-button');
    const accordionCollapses = document.querySelectorAll('.accordion-collapse');
    
    if (allExpanded) {
        // Keep all expanded
        accordionButtons.forEach(btn => {
            btn.classList.remove('collapsed');
            btn.setAttribute('aria-expanded', 'true');
        });
        
        accordionCollapses.forEach(collapse => {
            collapse.classList.add('show');
        });
        
        toggleBtn.innerHTML = '<i class="bi bi-arrows-collapse me-1"></i> Contraer Todos';
    } else {
        // Keep first one open, rest collapsed
        accordionButtons.forEach((btn, index) => {
            if (index === 0) {
                btn.classList.remove('collapsed');
                btn.setAttribute('aria-expanded', 'true');
            } else {
                btn.classList.add('collapsed');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
        
        accordionCollapses.forEach((collapse, index) => {
            if (index === 0) {
                collapse.classList.add('show');
            } else {
                collapse.classList.remove('show');
            }
        });
        
        toggleBtn.innerHTML = '<i class="bi bi-arrows-expand me-1"></i> Ver Todos';
    }
}

// Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});
