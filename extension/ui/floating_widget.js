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
        this.widget.innerHTML = "🛣️";
        this.widget.title = "RAASTA Assistant";
        document.body.appendChild(this.widget);

        // Create side panel
        this.panel = document.createElement("div");
        this.panel.id = "raasta-side-panel";
        this.panel.innerHTML = `
            <div id="raasta-side-panel-header">
                <h3>RAASTA Assistant</h3>
                <span id="raasta-close-btn">&times;</span>
            </div>
            <div id="raasta-side-panel-content">
                <div id="raasta-loading">Checking journey context...</div>
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
            if (e.target === self.widget) {
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
            // Trigger an event so content.js knows to update the UI
            document.dispatchEvent(new CustomEvent('raasta:panel_opened'));
        }
    }

    updateContent(html) {
        const contentDiv = document.getElementById("raasta-side-panel-content");
        if (contentDiv) {
            contentDiv.innerHTML = html;
        }
    }
}

window.raastaUI = new RaastaUI();
