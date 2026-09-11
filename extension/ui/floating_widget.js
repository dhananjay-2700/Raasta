// UI Management for Floating Widget and Side Panel

class RaastaUI {
    constructor() {
        this.widget = null;
        this.panel = null;
        this.isOpen = false;
        this.initialized = false;
        
        if (document.body) {
            this.init();
        } else {
            document.addEventListener("DOMContentLoaded", () => this.init());
        }
    }

    init() {
        if (this.initialized || !document.body) return;
        this.initialized = true;

        // Create widget
        this.widget = document.createElement("div");
        this.widget.id = "raasta-floating-widget";
        this.widget.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
        `;
        this.widget.title = "Open RAASTA";
        document.body.appendChild(this.widget);

        // Create side panel
        this.panel = document.createElement("div");
        this.panel.id = "raasta-side-panel";
        this.panel.innerHTML = `
            <div id="raasta-side-panel-header">
                <div class="raasta-header-content">
                    <h3 class="raasta-header-title">RAASTA</h3>
                    <div class="raasta-header-subtitle">
                        <span id="raasta-header-status-dot" class="raasta-status-dot idle"></span>
                        Application companion
                    </div>
                </div>
                <span id="raasta-close-btn">&times;</span>
            </div>
            <div id="raasta-side-panel-content">
                <div style="text-align: center; padding: 20px; color: var(--rs-text-secondary);">
                    Loading RAASTA...
                </div>
            </div>
        `;
        document.body.appendChild(this.panel);

        // Event listeners
        this.widget.addEventListener("click", () => this.togglePanel());
        document.getElementById("raasta-close-btn").addEventListener("click", () => this.togglePanel());

        // Basic drag logic for widget
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        this.widget.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        const self = this;
        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === self.widget || self.widget.contains(e.target)) {
                isDragging = true;
            }
        }
        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY, self.widget);
            }
        }
        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }

    openPanel() {
        if (!this.isOpen) {
            this.isOpen = true;
            this.panel.style.display = "flex";
            document.dispatchEvent(new CustomEvent('raasta:panel_opened'));
        }
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        this.panel.style.display = this.isOpen ? "flex" : "none";
        if (this.isOpen) {
            document.dispatchEvent(new CustomEvent('raasta:panel_opened'));
        }
    }

    updateContent(html) {
        const contentDiv = document.getElementById("raasta-side-panel-content");
        if (contentDiv) {
            contentDiv.innerHTML = html;
        }
    }
    
    setJourneyActive(isActive) {
        const dot = document.getElementById("raasta-header-status-dot");
        if (dot) {
            if (isActive) {
                dot.classList.remove("idle");
            } else {
                dot.classList.add("idle");
            }
        }
        
        let badge = document.getElementById("raasta-widget-badge");
        if (isActive && !badge) {
            badge = document.createElement("div");
            badge.id = "raasta-widget-badge";
            badge.className = "raasta-widget-badge";
            badge.innerHTML = "1";
            this.widget.appendChild(badge);
        } else if (!isActive && badge) {
            badge.remove();
        }
    }
}

window.raastaUI = new RaastaUI();
