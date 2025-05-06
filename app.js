class DocumentSearch {
    constructor() {
        this.index = new FlexSearch.Document({
            document: {
                id: "id",
                index: ["title", "body"],
                store: ["title", "filename", "body"]
            },
            tokenize: "forward"
        });
        this.searchInput = document.querySelector('.search-input');
        this.resultsContainer = document.querySelector('.results');
        this.documents = [];
        
        this.init();
    }

    async init() {
        try {
            const response = await fetch('index.json');
            const data = await response.json();
            this.documents = data.documents;
            
            this.documents.forEach(doc => this.index.add(doc));
            
            this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        } catch (error) {
            console.error('Error initializing search:', error);
            this.showError('Failed to load search index');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleSearch(event) {
        const query = event.target.value.trim();
        
        if (!query) {
            this.clearResults();
            return;
        }

        const results = this.index.search(query, {
            enrich: true,
            suggest: true
        });

        this.displayResults(results);
    }

    displayResults(results) {
        if (!results.length) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No matching documents found</h3>
                    <p>Try different keywords or check your spelling</p>
                </div>
            `;
            return;
        }

        const matchedDocs = new Set();
        const html = results
            .flatMap(result => result.result)
            .filter(item => {
                if (matchedDocs.has(item.id)) return false;
                matchedDocs.add(item.id);
                return true;
            })
            .map(item => {
                const doc = this.documents.find(d => d.id === item.id);
                const snippet = this.generateSnippet(doc.body);
                
                return `
                    <div class="result-item" onclick="window.open('docs/${doc.filename}', '_blank')">
                        <div class="result-title">${doc.title}</div>
                        <div class="result-filename">${doc.filename}</div>
                        <div class="result-snippet">${snippet}</div>
                    </div>
                `;
            })
            .join('');

        this.resultsContainer.innerHTML = html;
    }

    generateSnippet(text, length = 150) {
        return text.length > length 
            ? text.substring(0, length) + '...'
            : text;
    }

    clearResults() {
        this.resultsContainer.innerHTML = '';
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DocumentSearch();
});
