document.addEventListener('DOMContentLoaded', () => {
    const gridSizeSelect = document.getElementById('gridSize');
    const createGridBtn = document.getElementById('createGrid');
    const gridContainer = document.getElementById('gridContainer');
    const savePatternBtn = document.getElementById('savePattern');
    const exportJSONBtn = document.getElementById('exportJSON');
    const showOutputBtn = document.getElementById('showOutput');
    const patternsList = document.getElementById('patternsList');
    const lettersInput = document.getElementById('lettersInput');
    const resetLettersBtn = document.getElementById('resetLetters');
    const resetGridBtn = document.getElementById('resetGrid');
    const datasetFile = document.getElementById('datasetFile');
    const loadDatasetBtn = document.getElementById('loadDataset');
    const datasetSelect = document.getElementById('datasetSelect');
    const updatePatternBtn = document.getElementById('updatePattern');
    const exportDatasetBtn = document.getElementById('exportDataset');

    let currentGrid = [];
    let currentSize = 8; // Default size
    let isOutputView = false;
    let loadedDataset = null;

    // Create grid based on selected size
    createGridBtn.addEventListener('click', () => {
        const size = parseInt(gridSizeSelect.value.split('x')[0]);
        currentSize = size;
        createGrid(size);
        isOutputView = false;
        updateView();
    });

    // Show Output button click handler
    showOutputBtn.addEventListener('click', () => {
        isOutputView = !isOutputView;
        updateView();
        showOutputBtn.textContent = isOutputView ? 'Show Grid' : 'Show Output';
    });

    function updateView() {
        if (isOutputView) {
            gridContainer.classList.add('output-view');
            // Disable cell clicking in output view
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.style.pointerEvents = 'none';
            });
        } else {
            gridContainer.classList.remove('output-view');
            // Re-enable cell clicking in grid view
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.style.pointerEvents = 'auto';
            });
        }
    }

    // Function to find possible words in the grid
    function findPossibleWords(grid) {
        const words = new Set();
        const size = grid.length;

        // Check horizontal words (left to right)
        for (let i = 0; i < size; i++) {
            let word = '';
            for (let j = 0; j < size; j++) {
                if (grid[i][j]) {
                    word += grid[i][j];
                } else {
                    if (word.length > 1) {
                        words.add(word);
                    }
                    word = '';
                }
            }
            if (word.length > 1) {
                words.add(word);
            }
        }

        // Check vertical words (top to bottom)
        for (let j = 0; j < size; j++) {
            let word = '';
            for (let i = 0; i < size; i++) {
                if (grid[i][j]) {
                    word += grid[i][j];
                } else {
                    if (word.length > 1) {
                        words.add(word);
                    }
                    word = '';
                }
            }
            if (word.length > 1) {
                words.add(word);
            }
        }

        return Array.from(words);
    }

    // File input change handler
    datasetFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    loadedDataset = JSON.parse(event.target.result);
                    if (loadedDataset.patterns && Array.isArray(loadedDataset.patterns)) {
                        // Populate the select dropdown
                        datasetSelect.innerHTML = '<option value="">Select a pattern to update</option>';
                        loadedDataset.patterns.forEach((pattern, index) => {
                            const option = document.createElement('option');
                            option.value = index;
                            option.textContent = `Pattern ${index + 1} (${pattern.gridInfo.size}x${pattern.gridInfo.size}) - Stage ${pattern.stage}`;
                            datasetSelect.appendChild(option);
                        });
                        datasetSelect.disabled = false;
                    } else {
                        alert('Invalid dataset format');
                    }
                } catch (error) {
                    alert('Error loading dataset: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });

    // Dataset selection change handler
    datasetSelect.addEventListener('change', () => {
        const selectedIndex = datasetSelect.value;
        if (selectedIndex === '') return;

        const pattern = loadedDataset.patterns[selectedIndex];
        if (pattern) {
            // Update the current grid with the selected pattern
            currentSize = pattern.gridInfo.size;
            currentGrid = pattern.gridInfo.data;
            lettersInput.value = pattern.letters.join(', ');
            createGrid(pattern.gridInfo.size);
            
            // Fill in the grid with the pattern data
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                cell.textContent = pattern.gridInfo.data[row][col];
            });

            // Update the grid size select if needed
            gridSizeSelect.value = `${currentSize}x${currentSize}`;
        }
    });

    // Save pattern to localStorage
    savePatternBtn.addEventListener('click', () => {
        const letters = lettersInput.value.trim();
        if (!letters) {
            alert('Please enter letters first');
            return;
        }

        const possibleWords = findPossibleWords(currentGrid);

        const pattern = {
            level: 1,
            stage: patternsList.children.length + 1,
            stageId: `stage_${patternsList.children.length + 1}`,
            letters: letters.split(',').map(letter => letter.trim().toUpperCase()),
            gridInfo: {
                size: currentSize,
                data: currentGrid
            },
            possibleWords: possibleWords,
            timestamp: new Date().toISOString()
        };

        // Always save to localStorage
        let savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        savedPatterns.push(pattern);
        localStorage.setItem('patterns', JSON.stringify(savedPatterns));
        displaySavedPatterns();
        alert('Pattern saved to localStorage!');
    });

    // Export current pattern as JSON
    exportJSONBtn.addEventListener('click', () => {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        if (savedPatterns.length === 0) {
            alert('No patterns to export. Please save some patterns first.');
            return;
        }

        const exportData = {
            patterns: savedPatterns.map(pattern => ({
                level: pattern.level,
                stage: pattern.stage,
                stageId: pattern.stageId,
                letters: pattern.letters,
                gridInfo: pattern.gridInfo,
                possibleWords: pattern.possibleWords
            }))
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `patterns_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Export Dataset button click handler
    exportDatasetBtn.addEventListener('click', () => {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        if (savedPatterns.length === 0) {
            alert('No patterns to export. Please save some patterns first.');
            return;
        }

        const exportData = {
            patterns: savedPatterns
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `patterns_dataset_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Reset Letters button click handler
    resetLettersBtn.addEventListener('click', () => {
        lettersInput.value = '';
    });

    // Reset Grid button click handler
    resetGridBtn.addEventListener('click', () => {
        createGrid(currentSize);
    });

    // Load Dataset button click handler
    loadDatasetBtn.addEventListener('click', () => {
        datasetFile.click();
    });

    function createGrid(size) {
        gridContainer.innerHTML = '';
        currentGrid = Array(size).fill().map(() => Array(size).fill(''));
        
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('button');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                cell.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default button behavior
                    
                    // Create a temporary input element
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.style.position = 'fixed';
                    input.style.top = '0';
                    input.style.left = '0';
                    input.style.opacity = '0';
                    input.style.pointerEvents = 'none';
                    input.style.zIndex = '-1';
                    
                    // Add the input to the document
                    document.body.appendChild(input);
                    
                    // Focus the input
                    input.focus();
                    
                    // Handle input
                    input.addEventListener('input', (e) => {
                        e.preventDefault(); // Prevent default input behavior
                        const char = e.target.value.toUpperCase();
                        if (char) {
                            cell.textContent = char;
                            cell.innerHTML = char;
                            currentGrid[i][j] = char;
                            // Remove the input element
                            document.body.removeChild(input);
                        }
                    });

                    // Handle keydown
                    input.addEventListener('keydown', (e) => {
                        e.preventDefault(); // Prevent default keydown behavior
                        if (e.key === 'Escape') {
                            document.body.removeChild(input);
                        } else if (e.key.length === 1) {
                            // If it's a character key, handle it directly
                            const char = e.key.toUpperCase();
                            cell.textContent = char;
                            cell.innerHTML = char;
                            currentGrid[i][j] = char;
                            document.body.removeChild(input);
                        }
                    });

                    // Handle blur (when input loses focus)
                    input.addEventListener('blur', () => {
                        if (document.body.contains(input)) {
                            document.body.removeChild(input);
                        }
                    });
                });
                
                gridContainer.appendChild(cell);
            }
        }
    }

    function updateStatistics() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        
        // Calculate statistics
        const totalPatterns = savedPatterns.length;
        const totalLetters = savedPatterns.reduce((sum, pattern) => sum + pattern.letters.length, 0);
        const avgGridSize = savedPatterns.length > 0 
            ? savedPatterns.reduce((sum, pattern) => sum + pattern.gridInfo.size, 0) / savedPatterns.length 
            : 0;
        const totalWords = savedPatterns.reduce((sum, pattern) => sum + pattern.possibleWords.length, 0);
        const lastUpdated = savedPatterns.length > 0 
            ? new Date(Math.max(...savedPatterns.map(p => new Date(p.timestamp)))) 
            : null;

        // Update the table
        document.getElementById('totalPatterns').textContent = totalPatterns;
        document.getElementById('totalLetters').textContent = totalLetters;
        document.getElementById('avgGridSize').textContent = avgGridSize.toFixed(1);
        document.getElementById('totalWords').textContent = totalWords;
        document.getElementById('lastUpdated').textContent = lastUpdated 
            ? lastUpdated.toLocaleString() 
            : 'Never';
    }

    function updateStageStatistics() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        const stageStatsContainer = document.getElementById('stageStats');
        stageStatsContainer.innerHTML = '';

        // Group patterns by stage
        const patternsByStage = savedPatterns.reduce((acc, pattern) => {
            if (!acc[pattern.stage]) {
                acc[pattern.stage] = [];
            }
            acc[pattern.stage].push(pattern);
            return acc;
        }, {});

        // Create a card for each stage
        Object.entries(patternsByStage).forEach(([stage, patterns]) => {
            const card = document.createElement('div');
            card.className = 'stage-stat-card';

            // Calculate stage-specific statistics
            const totalLetters = patterns.reduce((sum, pattern) => sum + pattern.letters.length, 0);
            const avgGridSize = patterns.reduce((sum, pattern) => sum + pattern.gridInfo.size, 0) / patterns.length;
            const totalWords = patterns.reduce((sum, pattern) => sum + pattern.possibleWords.length, 0);
            const uniqueLetters = new Set(patterns.flatMap(pattern => pattern.letters)).size;
            const lastUpdated = new Date(Math.max(...patterns.map(p => new Date(p.timestamp))));

            card.innerHTML = `
                <h4>Stage ${stage}</h4>
                <table>
                    <tr>
                        <th>Patterns in Stage</th>
                        <td>${patterns.length}</td>
                    </tr>
                    <tr>
                        <th>Total Letters Used</th>
                        <td>${totalLetters}</td>
                    </tr>
                    <tr>
                        <th>Unique Letters</th>
                        <td>${uniqueLetters}</td>
                    </tr>
                    <tr>
                        <th>Average Grid Size</th>
                        <td>${avgGridSize.toFixed(1)}</td>
                    </tr>
                    <tr>
                        <th>Total Possible Words</th>
                        <td>${totalWords}</td>
                    </tr>
                    <tr>
                        <th>Average Words per Pattern</th>
                        <td>${(totalWords / patterns.length).toFixed(1)}</td>
                    </tr>
                    <tr>
                        <th>Last Updated</th>
                        <td>${lastUpdated.toLocaleString()}</td>
                    </tr>
                </table>
            `;

            stageStatsContainer.appendChild(card);
        });
    }

    // Update the displaySavedPatterns function to also update stage statistics
    function displaySavedPatterns() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        patternsList.innerHTML = '';

        savedPatterns.forEach((pattern, index) => {
            const patternElement = document.createElement('div');
            patternElement.className = 'pattern-item';
            
            const date = new Date(pattern.timestamp).toLocaleString();
            patternElement.innerHTML = `
                <strong>Pattern ${index + 1}</strong> (${pattern.gridInfo.size}x${pattern.gridInfo.size})
                <br>
                Letters: ${pattern.letters.join(', ')}
                <br>
                Stage: ${pattern.stage}
                <br>
                Possible Words: ${pattern.possibleWords.join(', ')}
                <br>
                Created: ${date}
                <br>
                <button onclick="loadPattern(${index})">Load</button>
                <button onclick="deletePattern(${index})">Delete</button>
            `;
            
            patternsList.appendChild(patternElement);
        });

        // Update both general and stage-specific statistics
        updateStatistics();
        updateStageStatistics();
    }

    // Load a saved pattern
    window.loadPattern = (index) => {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        const pattern = savedPatterns[index];
        
        if (pattern) {
            currentSize = pattern.gridInfo.size;
            currentGrid = pattern.gridInfo.data;
            lettersInput.value = pattern.letters.join(', ');
            createGrid(pattern.gridInfo.size);
            
            // Fill in the grid with saved data
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                cell.textContent = pattern.gridInfo.data[row][col];
            });
        }
    };

    // Delete a saved pattern
    window.deletePattern = (index) => {
        if (confirm('Are you sure you want to delete this pattern?')) {
            let savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
            savedPatterns.splice(index, 1);
            localStorage.setItem('patterns', JSON.stringify(savedPatterns));
            displaySavedPatterns();
        }
    };

    // Initial display of saved patterns and statistics
    displaySavedPatterns();
}); 