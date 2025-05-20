// Battle Anyone Application
export default function initBattleAnyone(container, windowData) {
    container.classList.add('battle-container');
    
    // Create the Vue app container
    const appContainer = document.createElement('div');
    appContainer.id = `${windowData.id}-battle-app`;
    container.appendChild(appContainer);
    
    // Create the Battle Anyone UI
    appContainer.innerHTML = `
        <div id="battle-app" class="battle-app" @click="initAudio">
            <div v-if="currentScreen === 'start'" class="battle-screen start-screen">
                <h2>Battle Anyone: The Game</h2>
                <div class="battle-menu">
                    <button @click="currentScreen = 'create-enemy'" class="battle-button">Create Enemy</button>
                    <button @click="startBattle" class="battle-button" :disabled="!selectedEnemy">Start Battle</button>
                    <button @click="currentScreen = 'inventory'" class="battle-button">Inventory</button>
                </div>
                <div v-if="enemies.length > 0" class="enemy-selection">
                    <h3>Select an Enemy</h3>
                    <div class="enemy-list">
                        <div v-for="(enemy, index) in enemies" :key="index" class="enemy-item" :class="{ 'selected': selectedEnemy === enemy }" @click="selectEnemy(enemy)">
                            <img :src="enemy.image" alt="Enemy" class="enemy-thumbnail">
                            <div class="enemy-info">
                                <h4>{{ enemy.name }}</h4>
                                <p>{{ enemy.personality }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Enemy creation screen -->
            <div v-if="currentScreen === 'create-enemy'" class="battle-screen create-enemy-screen">
                <h2>Create Enemy</h2>
                <div class="enemy-form">
                    <div class="form-group">
                        <label for="enemy-name">Name:</label>
                        <input type="text" id="enemy-name" v-model="newEnemy.name" placeholder="Enter enemy name">
                    </div>
                    <div class="form-group">
                        <label for="enemy-personality">Personality:</label>
                        <textarea id="enemy-personality" v-model="newEnemy.personality" placeholder="Describe the enemy's personality"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image:</label>
                        <div class="image-upload">
                            <input type="file" @change="uploadEnemyImage" accept="image/*" class="file-input">
                            <div class="upload-preview" v-if="newEnemy.image">
                                <img :src="newEnemy.image" alt="Enemy Preview">
                            </div>
                            <button class="battle-button small" @click="triggerFileInput">Upload Image</button>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button @click="saveEnemy" class="battle-button" :disabled="!newEnemy.name || !newEnemy.personality || !newEnemy.image">Save Enemy</button>
                    <button @click="currentScreen = 'start'" class="battle-button secondary">Cancel</button>
                </div>
            </div>
            
            <!-- Inventory screen -->
            <div v-if="currentScreen === 'inventory'" class="battle-screen inventory-screen">
                <h2>Inventory</h2>
                <div class="inventory-controls">
                    <button @click="currentItemType = 'healing'" class="battle-button" :class="{ 'active': currentItemType === 'healing' }">Healing</button>
                    <button @click="currentItemType = 'attack'" class="battle-button" :class="{ 'active': currentItemType === 'attack' }">Attack</button>
                    <button @click="currentItemType = 'defense'" class="battle-button" :class="{ 'active': currentItemType === 'defense' }">Defense</button>
                </div>
                <div class="item-list">
                    <div v-for="(item, index) in filteredItems" :key="index" class="item">
                        <div class="item-info">
                            <h4>{{ item.name }}</h4>
                            <p>{{ item.description }}</p>
                            <p>Power: {{ item.power }}</p>
                        </div>
                        <div class="item-actions">
                            <button @click="editItem(item)" class="battle-button small">Edit</button>
                            <button @click="deleteItem(item)" class="battle-button small danger">Delete</button>
                        </div>
                    </div>
                </div>
                <div class="inventory-form">
                    <h3>{{ editingItem ? 'Edit Item' : 'Create New Item' }}</h3>
                    <div class="form-group">
                        <label for="item-name">Name:</label>
                        <input type="text" id="item-name" v-model="newItem.name" placeholder="Enter item name">
                    </div>
                    <div class="form-group">
                        <label for="item-description">Description:</label>
                        <textarea id="item-description" v-model="newItem.description" placeholder="Describe the item"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="item-type">Type:</label>
                        <select id="item-type" v-model="newItem.type">
                            <option value="healing">Healing</option>
                            <option value="attack">Attack</option>
                            <option value="defense">Defense</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="item-power">Power:</label>
                        <input type="number" id="item-power" v-model="newItem.power" min="1" max="100">
                    </div>
                    <div class="form-actions">
                        <button @click="saveItem" class="battle-button" :disabled="!newItem.name || !newItem.description || !newItem.power">{{ editingItem ? 'Update' : 'Create' }}</button>
                        <button @click="cancelItemEdit" class="battle-button secondary">Cancel</button>
                    </div>
                </div>
                <div class="inventory-music">
                    <h3>Battle Music</h3>
                    <div class="form-group">
                        <label>Upload Music:</label>
                        <input type="file" @change="uploadBattleMusic" accept="audio/*" class="file-input">
                        <button class="battle-button small" @click="triggerMusicFileInput">Upload Music</button>
                    </div>
                    <div v-if="battleMusic" class="music-controls">
                        <audio controls :src="battleMusic"></audio>
                    </div>
                </div>
                <button @click="currentScreen = 'start'" class="battle-button">Back to Menu</button>
            </div>
            
            <!-- Battle screen -->
            <div v-if="currentScreen === 'battle'" class="battle-screen battle-game-screen">
                <div class="battle-header">
                    <div class="player-status">
                        <h3>You</h3>
                        <div class="health-bar">
                            <div class="health-fill" :style="{ width: (playerHealth / playerMaxHealth) * 100 + '%' }"></div>
                            <span class="health-text">{{ playerHealth }}/{{ playerMaxHealth }}</span>
                        </div>
                    </div>
                    <div class="enemy-status">
                        <h3>{{ battleEnemy.name }}</h3>
                        <div class="health-bar">
                            <div class="health-fill" :style="{ width: (enemyHealth / enemyMaxHealth) * 100 + '%' }"></div>
                            <span class="health-text">{{ enemyHealth }}/{{ enemyMaxHealth }}</span>
                        </div>
                    </div>
                </div>
                <div class="battle-area">
                    <div class="player-character">
                        <div class="character-sprite player-sprite"></div>
                    </div>
                    <div class="enemy-character">
                        <img :src="battleEnemy.image" alt="Enemy" class="enemy-sprite">
                    </div>
                </div>
                <div class="battle-controls" v-if="!battleEnded && playerTurn">
                    <div class="battle-actions">
                        <button @click="attack" class="battle-button">Attack</button>
                        <button @click="showItems = !showItems" class="battle-button">Items</button>
                        <button @click="flee" class="battle-button">Flee</button>
                    </div>
                    <div class="battle-items" v-if="showItems">
                        <div v-for="(item, index) in items" :key="index" class="battle-item" @click="useItem(item)">
                            <h4>{{ item.name }}</h4>
                            <p>{{ item.description }}</p>
                        </div>
                    </div>
                </div>
                <div class="battle-dialog">
                    <p>{{ battleMessage }}</p>
                    <button v-if="waitingForNext" @click="nextTurn" class="battle-button">Continue</button>
                </div>
                <div class="battle-end" v-if="battleEnded">
                    <h3>{{ victorious ? 'Victory!' : 'Defeat!' }}</h3>
                    <button @click="currentScreen = 'start'" class="battle-button">Return to Menu</button>
                </div>
            </div>
        </div>
    `;
    
    // Initialize Vue app
    const app = new Vue({
        el: `#${windowData.id}-battle-app`,
        data: {
            currentScreen: 'start',
            enemies: [],
            selectedEnemy: null,
            newEnemy: {
                name: '',
                personality: '',
                image: ''
            },
            items: [],
            currentItemType: 'healing',
            newItem: {
                name: '',
                description: '',
                type: 'healing',
                power: 10
            },
            editingItem: null,
            battleMusic: null,
            battleEnemy: null,
            playerHealth: 100,
            playerMaxHealth: 100,
            enemyHealth: 100,
            enemyMaxHealth: 100,
            battleMessage: '',
            playerTurn: true,
            waitingForNext: false,
            showItems: false,
            battleEnded: false,
            victorious: false,
            audio: null
        },
        computed: {
            filteredItems() {
                return this.items.filter(item => item.type === this.currentItemType);
            }
        },
        mounted() {
            // Load saved enemies and items from localStorage
            const savedEnemies = localStorage.getItem('battleAnyoneEnemies');
            if (savedEnemies) {
                this.enemies = JSON.parse(savedEnemies);
            }
            
            const savedItems = localStorage.getItem('battleAnyoneItems');
            if (savedItems) {
                this.items = JSON.parse(savedItems);
            }
            
            const savedMusic = localStorage.getItem('battleAnyoneMusic');
            if (savedMusic) {
                this.battleMusic = savedMusic;
            }
        },
        methods: {
            initAudio() {
                if (!this.audio) {
                    this.audio = new Audio();
                    
                    if (this.battleMusic) {
                        this.audio.src = this.battleMusic;
                        this.audio.loop = true;
                    }
                }
            },
            triggerFileInput() {
                const fileInput = document.querySelector('.file-input');
                fileInput.click();
            },
            triggerMusicFileInput() {
                const musicFileInput = document.querySelector('.inventory-music .file-input');
                musicFileInput.click();
            },
            uploadEnemyImage(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.newEnemy.image = e.target.result;
                };
                reader.readAsDataURL(file);
            },
            uploadBattleMusic(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.battleMusic = e.target.result;
                    localStorage.setItem('battleAnyoneMusic', this.battleMusic);
                    
                    if (this.audio) {
                        this.audio.src = this.battleMusic;
                        this.audio.loop = true;
                    }
                };
                reader.readAsDataURL(file);
            },
            saveEnemy() {
                if (!this.newEnemy.name || !this.newEnemy.personality || !this.newEnemy.image) {
                    return;
                }
                
                const enemy = {
                    name: this.newEnemy.name,
                    personality: this.newEnemy.personality,
                    image: this.newEnemy.image
                };
                
                this.enemies.push(enemy);
                localStorage.setItem('battleAnyoneEnemies', JSON.stringify(this.enemies));
                
                // Reset form and go back to start screen
                this.newEnemy = {
                    name: '',
                    personality: '',
                    image: ''
                };
                this.currentScreen = 'start';
                this.selectedEnemy = enemy;
            },
            selectEnemy(enemy) {
                this.selectedEnemy = enemy;
            },
            editItem(item) {
                this.editingItem = item;
                this.newItem = { ...item };
            },
            saveItem() {
                if (!this.newItem.name || !this.newItem.description || !this.newItem.power) {
                    return;
                }
                
                if (this.editingItem) {
                    // Update existing item
                    const index = this.items.indexOf(this.editingItem);
                    this.items[index] = { ...this.newItem };
                } else {
                    // Create new item
                    this.items.push({ ...this.newItem });
                }
                
                localStorage.setItem('battleAnyoneItems', JSON.stringify(this.items));
                
                // Reset form
                this.newItem = {
                    name: '',
                    description: '',
                    type: 'healing',
                    power: 10
                };
                this.editingItem = null;
            },
            cancelItemEdit() {
                this.editingItem = null;
                this.newItem = {
                    name: '',
                    description: '',
                    type: 'healing',
                    power: 10
                };
            },
            deleteItem(item) {
                const index = this.items.indexOf(item);
                if (index !== -1) {
                    this.items.splice(index, 1);
                    localStorage.setItem('battleAnyoneItems', JSON.stringify(this.items));
                }
            },
            startBattle() {
                if (!this.selectedEnemy) return;
                
                this.battleEnemy = this.selectedEnemy;
                this.playerHealth = this.playerMaxHealth = 100;
                this.enemyHealth = this.enemyMaxHealth = 100;
                this.battleMessage = `A wild ${this.battleEnemy.name} appears!`;
                this.playerTurn = true;
                this.waitingForNext = true;
                this.showItems = false;
                this.battleEnded = false;
                this.victorious = false;
                this.currentScreen = 'battle';
                
                // Start battle music
                if (this.audio && this.battleMusic) {
                    this.audio.currentTime = 0;
                    this.audio.play().catch(e => console.log('Audio play failed:', e));
                }
            },
            attack() {
                if (!this.playerTurn || this.waitingForNext) return;
                
                const damage = Math.floor(Math.random() * 20) + 10;
                this.enemyHealth = Math.max(0, this.enemyHealth - damage);
                this.battleMessage = `You attacked ${this.battleEnemy.name} for ${damage} damage!`;
                this.playerTurn = false;
                this.waitingForNext = true;
                this.showItems = false;
                
                if (this.enemyHealth <= 0) {
                    this.endBattle(true);
                }
            },
            useItem(item) {
                if (!this.playerTurn || this.waitingForNext) return;
                
                switch (item.type) {
                    case 'healing':
                        const healAmount = item.power;
                        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                        this.battleMessage = `You used ${item.name} and restored ${healAmount} health!`;
                        break;
                    case 'attack':
                        const damage = item.power;
                        this.enemyHealth = Math.max(0, this.enemyHealth - damage);
                        this.battleMessage = `You used ${item.name} and dealt ${damage} damage to ${this.battleEnemy.name}!`;
                        break;
                    case 'defense':
                        this.battleMessage = `You used ${item.name} and prepared for the enemy's attack!`;
                        break;
                }
                
                this.playerTurn = false;
                this.waitingForNext = true;
                this.showItems = false;
                
                if (this.enemyHealth <= 0) {
                    this.endBattle(true);
                }
            },
            flee() {
                if (!this.playerTurn || this.waitingForNext) return;
                
                const success = Math.random() > 0.3;
                if (success) {
                    this.battleMessage = 'You fled from battle!';
                    setTimeout(() => {
                        if (this.audio) {
                            this.audio.pause();
                        }
                        this.currentScreen = 'start';
                    }, 1500);
                } else {
                    this.battleMessage = 'You failed to flee!';
                    this.playerTurn = false;
                    this.waitingForNext = true;
                }
                this.showItems = false;
            },
            nextTurn() {
                if (this.battleEnded) return;
                
                if (!this.playerTurn) {
                    // Enemy turn
                    const damage = Math.floor(Math.random() * 15) + 5;
                    this.playerHealth = Math.max(0, this.playerHealth - damage);
                    
                    // Generate enemy dialogue based on personality
                    let dialogue = '';
                    if (this.battleEnemy.personality.toLowerCase().includes('aggressive')) {
                        dialogue = 'Take that, weakling!';
                    } else if (this.battleEnemy.personality.toLowerCase().includes('friendly')) {
                        dialogue = 'Sorry about this, but I have to fight!';
                    } else if (this.battleEnemy.personality.toLowerCase().includes('evil')) {
                        dialogue = 'Feel my wrath, pathetic human!';
                    } else if (this.battleEnemy.personality.toLowerCase().includes('wise')) {
                        dialogue = 'Every action has its consequence.';
                    } else {
                        dialogue = 'Take this!';
                    }
                    
                    this.battleMessage = `${this.battleEnemy.name} attacks for ${damage} damage! "${dialogue}"`;
                    
                    if (this.playerHealth <= 0) {
                        this.endBattle(false);
                    } else {
                        this.playerTurn = true;
                        this.waitingForNext = false;
                    }
                } else {
                    // Player's turn starts
                    this.waitingForNext = false;
                }
            },
            endBattle(victory) {
                this.battleEnded = true;
                this.victorious = victory;
                
                if (victory) {
                    this.battleMessage = `You defeated ${this.battleEnemy.name}!`;
                } else {
                    this.battleMessage = `You were defeated by ${this.battleEnemy.name}!`;
                }
                
                if (this.audio) {
                    this.audio.pause();
                }
            }
        }
    });
    
    // Return cleanup function
    return function cleanup() {
        if (app.audio) {
            app.audio.pause();
            app.audio = null;
        }
    };
}

