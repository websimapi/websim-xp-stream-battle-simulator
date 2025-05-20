// Application data
const apps = [
    {
        id: 'streamsim',
        name: 'Stream Simulator',
        icon: './assets/img/streamsim-icon.png',
        module: () => import('./streamsim.js')
    },
    {
        id: 'battleanyone',
        name: 'Battle Anyone',
        icon: './assets/img/battle-icon.png',
        module: () => import('./battleanyone.js')
    }
];

// State management
const state = {
    windows: [],
    activeWindow: null,
    showStartMenu: false,
    nextZIndex: 100
};

// DOM Elements
const desktop = document.getElementById('desktop');
const iconsContainer = document.getElementById('icons');
const windowsContainer = document.getElementById('windows');
const startButton = document.getElementById('start-button');
const startMenu = document.getElementById('start-menu');
const openWindowsContainer = document.getElementById('open-windows');
const timeDisplay = document.getElementById('time');

// Load CSS Files
function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

// Load app-specific CSS
loadCSS('./css/streamsim.css');
loadCSS('./css/battleanyone.css');

// Initialize the desktop
function initDesktop() {
    // Create desktop icons
    apps.forEach(app => {
        const iconElement = createDesktopIcon(app);
        iconsContainer.appendChild(iconElement);
    });
    
    // Populate start menu
    populateStartMenu();
    
    // Set up event listeners
    startButton.addEventListener('click', toggleStartMenu);
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startButton) {
            state.showStartMenu = false;
            startMenu.classList.add('hidden');
        }
    });
    
    // Start the clock
    updateClock();
    setInterval(updateClock, 1000);
}

// Create a desktop icon
function createDesktopIcon(app) {
    const iconElement = document.createElement('div');
    iconElement.className = 'desktop-icon';
    iconElement.innerHTML = `
        <img src="${app.icon}" alt="${app.name}">
        <span>${app.name}</span>
    `;
    iconElement.addEventListener('dblclick', () => {
        launchApp(app);
    });
    return iconElement;
}

// Populate the start menu
function populateStartMenu() {
    apps.forEach(app => {
        const menuItem = document.createElement('div');
        menuItem.className = 'start-menu-item';
        menuItem.innerHTML = `
            <img src="${app.icon}" alt="${app.name}">
            <span>${app.name}</span>
        `;
        menuItem.addEventListener('click', () => {
            launchApp(app);
            toggleStartMenu();
        });
        startMenu.appendChild(menuItem);
    });
}

// Toggle the start menu
function toggleStartMenu() {
    state.showStartMenu = !state.showStartMenu;
    if (state.showStartMenu) {
        startMenu.classList.remove('hidden');
    } else {
        startMenu.classList.add('hidden');
    }
}

// Update the clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}`;
}

// Launch an application
async function launchApp(app) {
    // Check if app is already open
    const existingWindow = state.windows.find(w => w.appId === app.id);
    if (existingWindow) {
        if (existingWindow.minimized) {
            toggleMinimize(existingWindow.id);
        }
        setActiveWindow(existingWindow.id);
        return;
    }
    
    // Create window
    const windowId = `window-${Date.now()}`;
    const windowData = {
        id: windowId,
        appId: app.id,
        title: app.name,
        icon: app.icon,
        minimized: false,
        position: { x: 50 + state.windows.length * 20, y: 50 + state.windows.length * 20 },
        size: { width: 800, height: 600 }
    };
    
    state.windows.push(windowData);
    
    // Create window DOM element
    const windowElement = createWindowElement(windowData);
    windowsContainer.appendChild(windowElement);
    
    // Create taskbar button
    createTaskbarButton(windowData);
    
    // Set as active window
    setActiveWindow(windowId);
    
    // Load app module
    try {
        const appModule = await app.module();
        appModule.default(document.getElementById(`${windowId}-content`), windowData);
    } catch (error) {
        console.error(`Failed to load app ${app.name}:`, error);
    }
}

// Create a window element
function createWindowElement(windowData) {
    const windowElement = document.createElement('div');
    windowElement.id = windowData.id;
    windowElement.className = 'window';
    windowElement.style.left = `${windowData.position.x}px`;
    windowElement.style.top = `${windowData.position.y}px`;
    windowElement.style.width = `${windowData.size.width}px`;
    windowElement.style.height = `${windowData.size.height}px`;
    windowElement.style.zIndex = state.nextZIndex++;
    
    windowElement.innerHTML = `
        <div class="window-titlebar" id="${windowData.id}-titlebar">
            <div class="window-title">
                <img src="${windowData.icon}" alt="${windowData.title}" style="height: 16px; margin-right: 5px;">
                ${windowData.title}
            </div>
            <div class="window-controls">
                <div class="window-control minimize" id="${windowData.id}-minimize">_</div>
                <div class="window-control maximize" id="${windowData.id}-maximize">□</div>
                <div class="window-control close" id="${windowData.id}-close">×</div>
            </div>
        </div>
        <div class="window-content" id="${windowData.id}-content"></div>
    `;
    
    // Make window active on click
    windowElement.addEventListener('mousedown', () => {
        setActiveWindow(windowData.id);
    });
    
    // Set up window controls
    setTimeout(() => {
        document.getElementById(`${windowData.id}-minimize`).addEventListener('click', () => {
            toggleMinimize(windowData.id);
        });
        
        document.getElementById(`${windowData.id}-maximize`).addEventListener('click', () => {
            toggleMaximize(windowData.id);
        });
        
        document.getElementById(`${windowData.id}-close`).addEventListener('click', () => {
            closeWindow(windowData.id);
        });
        
        // Make window draggable
        makeDraggable(windowData.id);
    }, 0);
    
    return windowElement;
}

// Create a taskbar button for an open window
function createTaskbarButton(windowData) {
    const button = document.createElement('div');
    button.id = `taskbar-${windowData.id}`;
    button.className = 'taskbar-button';
    button.innerHTML = `
        <img src="${windowData.icon}" alt="${windowData.title}">
        <span>${windowData.title}</span>
    `;
    
    button.addEventListener('click', () => {
        const windowIndex = state.windows.findIndex(w => w.id === windowData.id);
        if (state.windows[windowIndex].minimized) {
            toggleMinimize(windowData.id);
        } else if (state.activeWindow === windowData.id) {
            toggleMinimize(windowData.id);
        } else {
            setActiveWindow(windowData.id);
        }
    });
    
    openWindowsContainer.appendChild(button);
}

// Set the active window
function setActiveWindow(windowId) {
    // Deactivate current active window
    if (state.activeWindow) {
        const currentActiveWindow = document.getElementById(state.activeWindow);
        if (currentActiveWindow) {
            currentActiveWindow.style.zIndex = state.nextZIndex++;
        }
        
        const currentActiveTaskbarButton = document.getElementById(`taskbar-${state.activeWindow}`);
        if (currentActiveTaskbarButton) {
            currentActiveTaskbarButton.classList.remove('active');
        }
    }
    
    // Activate new window
    state.activeWindow = windowId;
    const newActiveWindow = document.getElementById(windowId);
    if (newActiveWindow) {
        newActiveWindow.style.zIndex = state.nextZIndex++;
    }
    
    const newActiveTaskbarButton = document.getElementById(`taskbar-${windowId}`);
    if (newActiveTaskbarButton) {
        newActiveTaskbarButton.classList.add('active');
    }
}

// Toggle window minimize
function toggleMinimize(windowId) {
    const windowIndex = state.windows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) return;
    
    const windowElement = document.getElementById(windowId);
    state.windows[windowIndex].minimized = !state.windows[windowIndex].minimized;
    
    if (state.windows[windowIndex].minimized) {
        windowElement.classList.add('minimized');
        if (state.activeWindow === windowId) {
            state.activeWindow = null;
        }
    } else {
        windowElement.classList.remove('minimized');
        setActiveWindow(windowId);
    }
}

// Toggle window maximize
function toggleMaximize(windowId) {
    const windowElement = document.getElementById(windowId);
    const windowIndex = state.windows.findIndex(w => w.id === windowId);
    
    if (windowElement.classList.contains('maximized')) {
        windowElement.classList.remove('maximized');
        windowElement.style.left = `${state.windows[windowIndex].position.x}px`;
        windowElement.style.top = `${state.windows[windowIndex].position.y}px`;
        windowElement.style.width = `${state.windows[windowIndex].size.width}px`;
        windowElement.style.height = `${state.windows[windowIndex].size.height}px`;
    } else {
        // Save current position and size
        state.windows[windowIndex].position = {
            x: parseInt(windowElement.style.left),
            y: parseInt(windowElement.style.top)
        };
        state.windows[windowIndex].size = {
            width: parseInt(windowElement.style.width),
            height: parseInt(windowElement.style.height)
        };
        
        // Maximize
        windowElement.classList.add('maximized');
        windowElement.style.left = '0';
        windowElement.style.top = '0';
        windowElement.style.width = '100%';
        windowElement.style.height = `calc(100% - 30px)`;
    }
}

// Close a window
function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    const taskbarButton = document.getElementById(`taskbar-${windowId}`);
    
    // Remove from DOM
    if (windowElement) windowElement.remove();
    if (taskbarButton) taskbarButton.remove();
    
    // Remove from state
    const windowIndex = state.windows.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
        state.windows.splice(windowIndex, 1);
    }
    
    // Update active window
    if (state.activeWindow === windowId) {
        state.activeWindow = null;
    }
}

// Make a window draggable
function makeDraggable(windowId) {
    const windowElement = document.getElementById(windowId);
    const titlebarElement = document.getElementById(`${windowId}-titlebar`);
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    titlebarElement.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set active window
        setActiveWindow(windowId);
        
        // Bring window to front
        windowElement.style.zIndex = state.nextZIndex++;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position
        const newTop = windowElement.offsetTop - pos2;
        const newLeft = windowElement.offsetLeft - pos1;
        
        // Apply bounds
        windowElement.style.top = `${Math.max(0, newTop)}px`;
        windowElement.style.left = `${Math.max(0, newLeft)}px`;
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        
        // Update window position in state
        const windowIndex = state.windows.findIndex(w => w.id === windowId);
        if (windowIndex !== -1) {
            state.windows[windowIndex].position = {
                x: parseInt(windowElement.style.left),
                y: parseInt(windowElement.style.top)
            };
        }
    }
}

// Initialize the desktop when the page loads
document.addEventListener('DOMContentLoaded', initDesktop);

