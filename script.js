document.addEventListener('DOMContentLoaded', () => {
    const gridSizeSelect = document.getElementById('gridSize');
    const createGridBtn = document.getElementById('createGrid');
    const gridContainer = document.getElementById('gridContainer');
    const savePatternBtn = document.getElementById('savePattern');
    const exportJSONBtn = document.getElementById('exportJSON');
    const showOutputBtn = document.getElementById('showOutput');
    const patternsList = document.getElementById('patternsList');
    const lettersDisplay = document.getElementById('lettersDisplay');
    const showJSONBtn = document.getElementById('showJSON');
    const jsonDisplay = document.getElementById('jsonDisplay');
    const lettersInput = document.getElementById('lettersInput');
    const resetLettersBtn = document.getElementById('resetLetters');
    const resetGridBtn = document.getElementById('resetGrid');
    const deleteAllDataBtn = document.getElementById('deleteAllData');

    let currentGrid = [];
    let currentSize = 8; // Default size
    let isOutputView = false;
    let letterFrequencies = new Map(); // Tracks minimum required letters for words

    // Function to calculate letter frequencies from a word
    function calculateWordLetterFrequencies(word) {
        const frequencies = new Map();
        for (const letter of word) {
            frequencies.set(letter, (frequencies.get(letter) || 0) + 1);
        }
        return frequencies;
    }

    // Function to update letter frequencies based on all possible words
    function updateLetterFrequenciesFromWords() {
        const words = findPossibleWords(currentGrid);
        letterFrequencies.clear();
        
        // For each word, calculate its letter frequencies
        words.forEach(({word}) => {
            const wordFrequencies = calculateWordLetterFrequencies(word);
            
            // Update the global frequencies to ensure we have enough letters for each word
            wordFrequencies.forEach((freq, letter) => {
                const currentFreq = letterFrequencies.get(letter) || 0;
                letterFrequencies.set(letter, Math.max(currentFreq, freq));
            });
        });
        
        updateLettersDisplay();
    }

    // Function to update the letters display
    function updateLettersDisplay() {
        lettersDisplay.innerHTML = '';
        // Sort letters alphabetically
        Array.from(letterFrequencies.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([letter, frequency]) => {
                const letterElement = document.createElement('div');
                letterElement.className = 'letter-item';
                letterElement.innerHTML = `
                    ${letter} (${frequency})
                    <button class="remove-letter" data-letter="${letter}">×</button>
                `;
                lettersDisplay.appendChild(letterElement);
            });

        // Add click handlers for remove buttons
        document.querySelectorAll('.remove-letter').forEach(button => {
            button.addEventListener('click', (e) => {
                const letter = e.target.dataset.letter;
                letterFrequencies.delete(letter);
                updateLettersDisplay();
            });
        });
    }

    // Function to find possible words in the grid with their locations
    function findPossibleWords(grid) {
        if (!grid || !Array.isArray(grid)) {
            console.warn('Invalid grid data for finding words');
            return [];
        }

        const words = new Map(); // Map to store words and their locations
        const size = grid.length;

        // Check horizontal words (left to right)
        for (let i = 0; i < size; i++) {
            let word = '';
            let startCol = 0;
            for (let j = 0; j < size; j++) {
                if (grid[i] && grid[i][j]) {
                    if (word === '') startCol = j;
                    word += grid[i][j];
                } else {
                    if (word.length > 1) {
                        words.set(word, {
                            type: 'horizontal',
                            row: i,
                            startCol: startCol,
                            endCol: j - 1
                        });
                    }
                    word = '';
                }
            }
            if (word.length > 1) {
                words.set(word, {
                    type: 'horizontal',
                    row: i,
                    startCol: startCol,
                    endCol: size - 1
                });
            }
        }

        // Check vertical words (top to bottom)
        for (let j = 0; j < size; j++) {
            let word = '';
            let startRow = 0;
            for (let i = 0; i < size; i++) {
                if (grid[i] && grid[i][j]) {
                    if (word === '') startRow = i;
                    word += grid[i][j];
                } else {
                    if (word.length > 1) {
                        words.set(word, {
                            type: 'vertical',
                            col: j,
                            startRow: startRow,
                            endRow: i - 1
                        });
                    }
                    word = '';
                }
            }
            if (word.length > 1) {
                words.set(word, {
                    type: 'vertical',
                    col: j,
                    startRow: startRow,
                    endRow: size - 1
                });
            }
        }

        return Array.from(words.entries()).map(([word, location]) => ({
            word,
            location
        }));
    }

    // Function to load patterns from localStorage
    function loadPatternsFromStorage() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        console.log('Loading patterns from storage:', savedPatterns);
        
        if (savedPatterns.length > 0) {
            // Set the grid size to match the first pattern
            const firstPattern = savedPatterns[0];
            currentSize = firstPattern.gridInfo.size;
            gridSizeSelect.value = `${currentSize}x${currentSize}`;
            
            // Create the grid
            createGrid(currentSize);
            
            // Load the first pattern
            loadPattern(0);
        }
    }

    // Function to get the next available level and stage
    function getNextLevelAndStage() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        
        if (savedPatterns.length === 0) {
            return { level: '1', stage: '1' };
        }

        // Find the highest level
        const highestLevel = Math.max(...savedPatterns.map(p => parseInt(p.level || '1')));
        
        // Find the highest stage in the current level
        const currentLevelPatterns = savedPatterns.filter(p => parseInt(p.level || '1') === highestLevel);
        const highestStage = Math.max(...currentLevelPatterns.map(p => parseInt(p.stage || '1')));
        
        // If we have 100 stages in the current level, move to next level
        if (highestStage >= 100) {
            return { level: (highestLevel + 1).toString(), stage: '1' };
        }
        
        return { level: highestLevel.toString(), stage: (highestStage + 1).toString() };
    }

    // Function to display saved patterns
    function displaySavedPatterns() {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        console.log('Displaying patterns:', savedPatterns);
        
        patternsList.innerHTML = '';
        const updatedPatternsList = document.getElementById('updatedPatternsList');
        updatedPatternsList.innerHTML = '';

        if (savedPatterns.length === 0) {
            patternsList.innerHTML = '<p>No patterns saved yet.</p>';
            updatedPatternsList.innerHTML = '<p>No updated patterns yet.</p>';
            return;
        }

        // Sort patterns by level and stage
        savedPatterns.sort((a, b) => {
            const levelA = parseInt(a.level || '1');
            const levelB = parseInt(b.level || '1');
            if (levelA !== levelB) return levelA - levelB;
            return parseInt(a.stage || '1') - parseInt(b.stage || '1');
        });

        // Separate original and updated patterns
        const originalPatterns = savedPatterns.filter(pattern => !pattern.isUpdated);
        const updatedPatterns = savedPatterns.filter(pattern => pattern.isUpdated);

        // Display original patterns
        originalPatterns.forEach((pattern, index) => {
            console.log('Creating pattern element for:', pattern);
            
            const patternElement = document.createElement('div');
            patternElement.className = 'pattern-item';
            
            const date = new Date(pattern.timestamp).toLocaleString();
            const wordsList = (pattern.possibleWords || []).map(({word, location}) => {
                if (!location) return word;
                const loc = location.type === 'horizontal' 
                    ? `Row ${location.row + 1}, Cols ${location.startCol + 1}-${location.endCol + 1}`
                    : `Col ${location.col + 1}, Rows ${location.startRow + 1}-${location.endRow + 1}`;
                return `${word} (${loc})`;
            }).join('<br>');

            patternElement.innerHTML = `
                <strong>Level ${pattern.level || '1'}, Stage ${pattern.stage || '1'}</strong> (${pattern.gridInfo.size}x${pattern.gridInfo.size})
                <br>
                Stage ID: ${pattern.stageId || `level${pattern.level}_stage${pattern.stage}`}
                <br>
                Letters: ${(pattern.letters || []).join(', ')}
                <br>
                Possible Words:<br>${wordsList || 'No words found'}
                <br>
                Created: ${date}
                <br>
                <button onclick="loadPattern(${savedPatterns.indexOf(pattern)})">Load</button>
                <button onclick="deletePattern(${savedPatterns.indexOf(pattern)})">Delete</button>
                <button onclick="showPatternJSON(${savedPatterns.indexOf(pattern)})">Show JSON</button>
            `;
            
            patternsList.appendChild(patternElement);
        });

        // Display updated patterns
        if (updatedPatterns.length > 0) {
            updatedPatterns.forEach((pattern, index) => {
                const patternElement = document.createElement('div');
                patternElement.className = 'pattern-item updated';
                
                const date = new Date(pattern.timestamp).toLocaleString();
                const wordsList = (pattern.possibleWords || []).map(({word, location}) => {
                    if (!location) return word;
                    const loc = location.type === 'horizontal' 
                        ? `Row ${location.row + 1}, Cols ${location.startCol + 1}-${location.endCol + 1}`
                        : `Col ${location.col + 1}, Rows ${location.startRow + 1}-${location.endRow + 1}`;
                    return `${word} (${loc})`;
                }).join('<br>');

                patternElement.innerHTML = `
                    <strong>Updated Pattern ${pattern.stage || '1'}</strong> (${pattern.gridInfo.size}x${pattern.gridInfo.size})
                    <br>
                    Original Stage: ${pattern.stage || '1'}
                    <br>
                    Letters: ${(pattern.letters || []).join(', ')}
                    <br>
                    Possible Words:<br>${wordsList || 'No words found'}
                    <br>
                    Last Updated: ${date}
                    <br>
                    <button onclick="loadPattern(${savedPatterns.indexOf(pattern)})">Load</button>
                    <button onclick="deletePattern(${savedPatterns.indexOf(pattern)})">Delete</button>
                    <button onclick="showPatternJSON(${savedPatterns.indexOf(pattern)})">Show JSON</button>
                `;
                
                updatedPatternsList.appendChild(patternElement);
            });
        } else {
            updatedPatternsList.innerHTML = '<p>No updated patterns yet.</p>';
        }
    }

    // Load a saved pattern
    window.loadPattern = (index) => {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        console.log('Loading pattern at index:', index, 'from:', savedPatterns);
        
        const pattern = savedPatterns[index];
        
        if (pattern) {
            currentSize = pattern.gridInfo.size;
            currentGrid = pattern.gridInfo.data;
            
            // Update letter frequencies based on words in the grid
            updateLetterFrequenciesFromWords();
            
            createGrid(pattern.gridInfo.size);
            
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                cell.textContent = pattern.gridInfo.data[row][col];
            });

            // Update the grid size select if needed
            gridSizeSelect.value = `${currentSize}x${currentSize}`;
        }
    };

    // Delete a saved pattern
    window.deletePattern = (index) => {
        if (confirm('Are you sure you want to delete this pattern?')) {
            let savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
            console.log('Deleting pattern at index:', index, 'from:', savedPatterns);
            
            savedPatterns.splice(index, 1);
            localStorage.setItem('patterns', JSON.stringify(savedPatterns));
            console.log('Updated patterns in storage:', savedPatterns);
            
            displaySavedPatterns();
            
            // If we deleted the last pattern, reset the grid
            if (savedPatterns.length === 0) {
                createGrid(currentSize);
                letterFrequencies.clear();
                updateLettersDisplay();
            }
        }
    };

    // Show individual pattern JSON
    window.showPatternJSON = (index) => {
        const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
        const pattern = savedPatterns[index];
        
        if (pattern) {
            const patternData = {
                level: pattern.level,
                stage: pattern.stage,
                stageId: pattern.stageId,
                letters: pattern.letters,
                gridInfo: {
                    size: pattern.gridInfo.size,
                    data: pattern.gridInfo.data
                },
                validWords: pattern.possibleWords.map(({word, location}) => ({
                    word,
                    placement: {
                        type: location.type,
                        coordinates: location.type === 'horizontal' 
                            ? {
                                row: location.row + 1,
                                startCol: location.startCol + 1,
                                endCol: location.endCol + 1
                            }
                            : {
                                col: location.col + 1,
                                startRow: location.startRow + 1,
                                endRow: location.endRow + 1
                            }
                    }
                }))
            };

            jsonDisplay.textContent = JSON.stringify(patternData, null, 2);
            jsonDisplay.classList.add('visible');
            showJSONBtn.textContent = 'Show All JSON';
        }
    };

    // Initialize event listeners only if elements exist
    if (createGridBtn) {
        createGridBtn.addEventListener('click', () => {
            const size = parseInt(gridSizeSelect.value.split('x')[0]);
            currentSize = size;
            createGrid(size);
            isOutputView = false;
            updateView();
        });
    }

    if (showOutputBtn) {
        showOutputBtn.addEventListener('click', () => {
            isOutputView = !isOutputView;
            updateView();
            showOutputBtn.textContent = isOutputView ? 'Show Grid' : 'Show Output';
        });
    }

    if (savePatternBtn) {
        savePatternBtn.addEventListener('click', () => {
            // Validate that the grid has some content
            const hasContent = currentGrid.some(row => row.some(cell => cell));
            if (!hasContent) {
                alert('Please add some letters to the grid before saving.');
                return;
            }

            // Get next available level and stage
            const { level, stage } = getNextLevelAndStage();

            // Update letter frequencies based on current words
            updateLetterFrequenciesFromWords();

            const pattern = {
                gridInfo: {
                    size: currentSize,
                    data: currentGrid.map(row => [...row]) // Create a deep copy of the grid
                },
                letters: Array.from(letterFrequencies.entries()).map(([letter, freq]) => 
                    Array(freq).fill(letter)
                ).flat(), // Convert frequencies to array of letters
                possibleWords: findPossibleWords(currentGrid),
                timestamp: new Date().toISOString(),
                stage: stage,
                level: level,
                stageId: `level${level}_stage${stage}` // Add a unique stage ID
            };

            // Get existing patterns from localStorage
            const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
            
            // Add the new pattern
            savedPatterns.push(pattern);
            
            // Save to localStorage
            localStorage.setItem('patterns', JSON.stringify(savedPatterns));
            
            // Update the display
            displaySavedPatterns();
            
            // Reset the grid and used letters
            createGrid(currentSize);
            letterFrequencies.clear();
            updateLettersDisplay();
            
            // Show success message
            alert(`Pattern saved successfully! Level ${level}, Stage ${stage}`);
        });
    }

    if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', () => {
            // Get all saved patterns
            const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
            
            if (savedPatterns.length === 0) {
                alert('No patterns to export. Please save some patterns first.');
                return;
            }

            // Create the export data with all patterns
            const exportData = {
                patterns: savedPatterns.map(pattern => ({
                    gridInfo: {
                        size: pattern.gridInfo.size,
                        data: pattern.gridInfo.data
                    },
                    letters: pattern.letters,
                    possibleWords: pattern.possibleWords,
                    timestamp: pattern.timestamp,
                    stage: pattern.stage,
                    level: pattern.level,
                    stageId: pattern.stageId
                }))
            };

            // Create a blob with the JSON data
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `patterns_${new Date().toISOString().slice(0,10)}.json`;
            
            // Trigger the download
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (showJSONBtn) {
        showJSONBtn.addEventListener('click', () => {
            const savedPatterns = JSON.parse(localStorage.getItem('patterns') || '[]');
            if (savedPatterns.length === 0) {
                alert('No patterns to display. Please save some patterns first.');
                return;
            }

            const exportData = {
                patterns: savedPatterns.map(pattern => {
                    // Format grid data as array of arrays
                    const gridData = pattern.gridInfo.data.map(row => 
                        row.map(cell => cell || '')
                    );
                    
                    // Only include non-empty words
                    const validWords = (pattern.possibleWords || [])
                        .filter(({word}) => word && word.length > 1)
                        .map(({word, location}) => ({
                            word,
                            placement: {
                                type: location.type,
                                coordinates: location.type === 'horizontal' 
                                    ? {
                                        row: location.row + 1,
                                        startCol: location.startCol + 1,
                                        endCol: location.endCol + 1
                                    }
                                    : {
                                        col: location.col + 1,
                                        startRow: location.startRow + 1,
                                        endRow: location.endRow + 1
                                    }
                            }
                        }));

                    return {
                        level: pattern.level,
                        stage: pattern.stage,
                        stageId: pattern.stageId,
                        letters: pattern.letters,
                        gridInfo: {
                            size: pattern.gridInfo.size,
                            data: gridData
                        },
                        validWords
                    };
                })
            };

            jsonDisplay.textContent = JSON.stringify(exportData, null, 2);
            jsonDisplay.classList.toggle('visible');
            showJSONBtn.textContent = jsonDisplay.classList.contains('visible') ? 'Hide JSON' : 'Show All JSON';
        });
    }

    // Reset Letters button click handler
    resetLettersBtn.addEventListener('click', () => {
        lettersInput.value = '';
    });

    // Reset Grid button click handler
    resetGridBtn.addEventListener('click', () => {
        createGrid(currentSize);
    });

    // Add event listener for delete all data button
    if (deleteAllDataBtn) {
        deleteAllDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all saved patterns?')) {
                localStorage.clear();
                alert('All data has been cleared!');
            }
        });
    }

    function createGrid(size) {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        
        // Initialize currentGrid as a 2D array
        currentGrid = Array(size).fill().map(() => Array(size).fill(''));
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('button');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Set initial value if it exists in currentGrid
                if (currentGrid[i] && currentGrid[i][j]) {
                    cell.textContent = currentGrid[i][j];
                }
                
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    cell.focus();
                });

                cell.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        // Clear the cell
                        cell.textContent = '';
                        currentGrid[i][j] = '';
                        
                        // Update letter frequencies based on remaining words
                        updateLetterFrequenciesFromWords();
                    } else if (e.key.length === 1) {
                        // Only allow letters
                        const char = e.key.toUpperCase();
                        if (/^[A-Z]$/.test(char)) {
                            cell.textContent = char;
                            currentGrid[i][j] = char;
                            
                            // Update letter frequencies based on new words
                            updateLetterFrequenciesFromWords();
                        }
                    }
                });
                
                // Make the cell focusable
                cell.tabIndex = 0;
                cell.style.outline = 'none';
                
                gridContainer.appendChild(cell);
            }
        }
    }

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

    // Initial setup
    console.log('Initializing application...');
    loadPatternsFromStorage();
    displaySavedPatterns();
}); 