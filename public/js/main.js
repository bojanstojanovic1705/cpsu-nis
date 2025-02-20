document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Dynamic news loading for home page
    const newsGrid = document.getElementById('newsGrid');
    if (newsGrid) {
        fetch('/api/news')
            .then(response => response.json())
            .then(news => {
                news.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4 mb-4';
                    
                    const card = document.createElement('div');
                    card.className = 'card h-100';
                    
                    const cardBody = document.createElement('div');
                    cardBody.className = 'card-body';
                    
                    const title = document.createElement('h5');
                    title.className = 'card-title';
                    title.textContent = item.title;
                    
                    const date = document.createElement('p');
                    date.className = 'card-text text-muted small';
                    date.textContent = new Date(item.created_at).toLocaleDateString('sr-RS');
                    
                    const text = document.createElement('p');
                    text.className = 'card-text';
                    text.textContent = item.content;
                    
                    cardBody.appendChild(title);
                    cardBody.appendChild(date);
                    cardBody.appendChild(text);
                    card.appendChild(cardBody);
                    col.appendChild(card);
                    
                    newsGrid.appendChild(col);
                });
            })
            .catch(error => console.error('Error loading news:', error));
    }
});
