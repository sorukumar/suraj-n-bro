// app.js
class DocumentSearch {
    constructor() {
        this.index = new FlexSearch.Document({
            document: {
                id: "id",
                index: ["title", "body"],
                store: ["title", "filename", "body"]
            }
        });
        this.searchInput = document.querySelector('.search-input');
        this.resultsContainer = document.querySelector('.results');
        this.documents = [];
        
        this.init();
    }

    async init() {
        try {
            // Load the index
            const response = await fetch('index.json');
            const data = await response.json();
            this.documents = data.documents;
            
            // Add documents to the index
            this.documents.forEach(doc => this.index.add(doc));
            
            // Set up event listeners
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        } catch (error) {
            console.error('Error initializing search:', error);
        }
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
}

// Initialize the search when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DocumentSearch();
});
