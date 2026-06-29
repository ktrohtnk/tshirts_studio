// DOM Elements
const fileInput = document.getElementById('fileInput');
const currentFile = document.getElementById('currentFile');
const loadingOverlay = document.getElementById('loadingOverlay');
const exportBtn = document.getElementById('exportBtn');
const viewBtns = document.querySelectorAll('.view-btn');
const viewCards = document.querySelectorAll('.view-card');
const previewContainer = document.getElementById('previewContainer');
const viewSelectors = document.querySelectorAll('.view-btn');
const designElements = document.querySelectorAll('.design-element');

// View Switching
viewSelectors.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        viewSelectors.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.getAttribute('data-target');

        if (targetId === 'view-all') {
            previewContainer.classList.add('grid-view');
            // When in grid view, we don't need to change active class on view-cards
            // because CSS handles forcing them all to display.
        } else {
            previewContainer.classList.remove('grid-view');
            
            // Remove active class from all view cards
            const viewCards = document.querySelectorAll('.view-card');
            viewCards.forEach(card => card.classList.remove('active'));

            // Add active class to target view card
            const targetCard = document.getElementById(targetId);
            if (targetCard) targetCard.classList.add('active');
        }
    });
});

// Card Delete Buttons
const cardDeleteBtns = document.querySelectorAll('.card-delete-btn');
cardDeleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const viewCard = e.target.closest('.view-card');
        if (!viewCard) return;
        
        const img = viewCard.querySelector('.design-img');
        const el = viewCard.querySelector('.design-element');
        
        if (img && el) {
            img.src = '';
            el.classList.remove('active');
            viewCard.classList.remove('has-design');
        }
        
        // Reset file input text if no designs remain
        const anyActive = document.querySelector('.design-element.active');
        if (!anyActive) {
            document.getElementById('currentFile').textContent = 'NO FILE SELECTED';
            const fileInput = document.getElementById('fileInput');
            if(fileInput) fileInput.value = '';
        }
    });
});

// Center elements initially
designElements.forEach(el => {
    const isInner = el.closest('#view-inner') !== null;
    const initialX = isInner ? 280 : 250;
    // Position inner tag much lower (y=450) so it spawns perfectly in the middle of the neck hole mask!
    const initialY = isInner ? 450 : 250; 
    
    el.style.transform = `translate(${initialX}px, ${initialY}px)`;
    el.setAttribute('data-x', initialX);
    el.setAttribute('data-y', initialY);
});

// Scale tracking for responsive design
function getScale(target) {
    const card = target.closest('.view-card') || target.closest('.model-preview-stage');
    if (!card) return 1;
    
    const isMobile = window.innerWidth <= 768;
    const isGridView = document.getElementById('previewContainer') && document.getElementById('previewContainer').classList.contains('grid-view');
    
    // Default: scale to fit width
    let scale = card.offsetWidth / 800;
    
    // On mobile single view (9:16 ratio), scale up to fill vertical space better
    // We use a blend of width and height to make it immersive without cutting off too much.
    if (isMobile && !isGridView && card.classList.contains('view-card')) {
        const heightScale = card.offsetHeight / 800;
        // Use heightScale * 0.85 so it fills most of the vertical space, cropping sides.
        scale = Math.max(scale, heightScale * 0.85);
    } else if (card.classList.contains('model-preview-stage')) {
        // For the model preview stage, ensure the full 800x800 container fits within the bounds
        const heightScale = card.offsetHeight / 800;
        scale = Math.min(scale, heightScale);
    }
    
    return scale;
}

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        const card = entry.target;
        const container = card.querySelector('.mockup-container');
        if (container) {
            const scale = getScale(container);
            container.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }
});
viewCards.forEach(card => resizeObserver.observe(card));

document.addEventListener('DOMContentLoaded', () => {
    const modelStage = document.querySelector('.model-preview-stage');
    if (modelStage) {
        resizeObserver.observe(modelStage);
    }
});// Setup Drag and Resize using interact.js
interact('.resizable-draggable')
    .draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        autoScroll: true,
        listeners: {
            move: dragMoveListener
        }
    })
    .resizable({
        edges: {
            top: '.top-left, .top-right',
            left: '.top-left, .bottom-left',
            bottom: '.bottom-left, .bottom-right',
            right: '.top-right, .bottom-right'
        },
        modifiers: [
            interact.modifiers.aspectRatio({
                ratio: 'preserve',
            })
        ],
        inertia: true
    })
    .on('resizemove', function (event) {
        var target = event.target;
        var scale = getScale(target);
        var x = (parseFloat(target.getAttribute('data-x')) || 0);
        var y = (parseFloat(target.getAttribute('data-y')) || 0);

        // event.rect is the physical screen rect, we need to divide by scale
        var newWidth = event.rect.width / scale;
        target.style.width = newWidth + 'px';

        x += (event.deltaRect.left / scale);
        y += (event.deltaRect.top / scale);

        target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    })
    .gesturable({
        listeners: {
            move(event) {
                var target = event.target;
                var currentWidth = parseFloat(target.style.width) || target.offsetWidth || 300;
                // event.ds is the difference in scale
                var newWidth = currentWidth * (1 + event.ds);
                
                target.style.width = newWidth + 'px';
            }
        }
    });

function dragMoveListener (event) {
    var target = event.target;
    var scale = getScale(target);
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + (event.dx / scale);
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + (event.dy / scale);

    // translate the element
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}


function applyImageToCard(dataUrl, targetCard) {
    if (!targetCard) return;
    const img = targetCard.querySelector('.design-img');
    const el = targetCard.querySelector('.design-element');
    
    if (img && el) {
        img.src = dataUrl;
        el.classList.add('active');
        targetCard.classList.add('has-design');
    }
}

function handleImageUpload(file, targetCard) {
    const reader = new FileReader();
    reader.onload = (f) => {
        applyImageToCard(f.target.result, targetCard);
    };
    reader.readAsDataURL(file);
}

async function handlePsdUpload(file, targetCard) {
    loadingOverlay.classList.add('active');
    try {
        const arrayBuffer = await file.arrayBuffer();
        const psd = agPsd.readPsd(arrayBuffer);
        
        if (!psd.canvas) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = psd.width;
            tempCanvas.height = psd.height;
            const tCtx = tempCanvas.getContext('2d');
            let hasDrawn = false;
            
            if (psd.children) {
                for (let i = psd.children.length - 1; i >= 0; i--) {
                    const layer = psd.children[i];
                    if (!layer.hidden && layer.canvas) {
                        tCtx.globalAlpha = layer.opacity !== undefined ? layer.opacity / 255 : 1;
                        tCtx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
                        hasDrawn = true;
                    }
                }
            }

            if (hasDrawn) {
                psd.canvas = tempCanvas;
            } else {
                alert('Could not render PSD. Make sure the PSD is saved with Maximize Compatibility.');
                loadingOverlay.classList.remove('active');
                return;
            }
        }

        const dataUrl = psd.canvas.toDataURL('image/png');
        applyImageToCard(dataUrl, targetCard);
    } catch (err) {
        console.error(err);
        alert('Error parsing PSD file.');
    } finally {
        loadingOverlay.classList.remove('active');
    }
}

// Handle File Upload via Input
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentFileText = document.getElementById('currentFile');
    currentFileText.textContent = file.name;

    // Determine target card (active one, or default to front if in grid mode)
    let targetCard = document.querySelector('.view-card.active');
    if (!targetCard) targetCard = document.getElementById('view-front');

    if (file.name.toLowerCase().endsWith('.psd')) {
        handlePsdUpload(file, targetCard);
    } else {
        handleImageUpload(file, targetCard);
    }
    
    fileInput.value = ''; // reset
});

// Robust File Upload via Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

window.addEventListener('dragover', (e) => {
    let card = e.target.closest('.view-card');
    
    // If dragging outside a card, default to the currently active one
    if (!card) {
        card = document.querySelector('.view-card.active');
    }
    // If in ALL VIEWS and outside any card, default to front
    if (!card) {
        card = document.getElementById('view-front');
    }

    if (card) {
        viewCards.forEach(c => c.classList.remove('drag-over'));
        card.classList.add('drag-over');
    }
});

window.addEventListener('dragleave', (e) => {
    if (!e.relatedTarget) {
        viewCards.forEach(c => c.classList.remove('drag-over'));
    }
});

window.addEventListener('drop', (e) => {
    viewCards.forEach(c => c.classList.remove('drag-over'));
    
    let card = e.target.closest('.view-card');
    
    // If dropped outside a card, default to the currently active one
    if (!card) {
        card = document.querySelector('.view-card.active');
    }
    // If in ALL VIEWS and outside any card, default to front
    if (!card) {
        card = document.getElementById('view-front');
    }

    if (!card) return;

    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (!file) return;

    if (!file.name.match(/\.(jpg|jpeg|png|psd)$/i)) {
        alert('Please drop a JPG, PNG, or PSD file.');
        return;
    }

    const currentFileText = document.getElementById('currentFile');
    currentFileText.textContent = file.name;

    if (file.name.toLowerCase().endsWith('.psd')) {
        handlePsdUpload(file, card);
    } else {
        handleImageUpload(file, card);
    }
});

// Export Handling - Native Canvas Composite
exportBtn.addEventListener('click', async () => {
    const activeCard = document.querySelector('.view-card.active');
    if (!activeCard) return;
    
    const container = activeCard.querySelector('.mockup-container');
    const viewName = activeCard.getAttribute('data-view');
    const baseShirtImg = activeCard.querySelector('.base-shirt');
    const designImg = activeCard.querySelector('.design-img');
    const designElement = activeCard.querySelector('.design-element');
    
    if (!container || !baseShirtImg) return;

    loadingOverlay.classList.add('active');

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        // Draw Base Shirt
        ctx.drawImage(baseShirtImg, 0, 0, 800, 800);

        // Draw Design if active
        if (designElement.classList.contains('active') && designImg.src) {
            const designCanvas = document.createElement('canvas');
            designCanvas.width = 800;
            designCanvas.height = 800;
            const dCtx = designCanvas.getContext('2d');

            // Calculate design element position
            const x = parseFloat(designElement.getAttribute('data-x')) || 0;
            const y = parseFloat(designElement.getAttribute('data-y')) || 0;
            const width = parseFloat(designElement.style.width) || designElement.offsetWidth || 300;
            
            // We need to determine the height based on aspect ratio
            const imgAspect = designImg.naturalHeight / designImg.naturalWidth;
            const height = width * imgAspect;

            // Draw design onto temp canvas
            dCtx.drawImage(designImg, x, y, width, height);

            // Apply Mask
            const maskImg = new Image();
            maskImg.crossOrigin = "anonymous";
            // viewName is 'front', 'back', 'inner_tag', or 'outer_collar'
            let maskName = viewName.replace('_tag', '').replace('outer_', '');
            maskImg.src = `assets/mask_${maskName}.png`;
            
            await new Promise((resolve) => {
                maskImg.onload = resolve;
                maskImg.onerror = resolve; // proceed even if mask fails
            });

            if (maskImg.complete && maskImg.naturalWidth > 0) {
                dCtx.globalCompositeOperation = 'destination-in';
                dCtx.drawImage(maskImg, 0, 0, 800, 800);
            }

            // Draw masked design onto main canvas
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(designCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over'; // restore defaults
        }

        const dataURL = canvas.toDataURL('image/png');
        
        // Mobile iOS Web Share API for Camera Roll
        let shared = false;
        if (navigator.share) {
            try {
                const response = await fetch(dataURL);
                const blob = await response.blob();
                const file = new File([blob], `tshirt_mockup_${viewName}.png`, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'T-Shirt Design',
                    });
                    shared = true;
                }
            } catch (err) {
                console.log("Share API failed or user cancelled", err);
            }
        }

        // Fallback for Desktop or if Share API is unavailable
        if (!shared) {
            const link = document.createElement('a');
            link.download = `tshirt_mockup_${viewName}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch(e) {
        console.error(e);
        alert("Error exporting image.");
    } finally {
        loadingOverlay.classList.remove('active');
    }
});

/* =========================================================================
   MOBILE RESPONSIVE LOGIC
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const sidebar = document.getElementById('sidebar');

    function toggleMenu() {
        sidebar.classList.toggle('open');
        menuBackdrop.classList.toggle('open');
    }

    function closeMenu() {
        sidebar.classList.remove('open');
        menuBackdrop.classList.remove('open');
    }

    if (mobileMenuBtn && menuBackdrop && sidebar) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
        menuBackdrop.addEventListener('click', closeMenu);
        
        // Auto-close menu when a view is selected on mobile
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMenu();
                }
            });
        });

        // Auto-close menu when file is selected
        const fileInput = document.getElementById('fileInput');
        if(fileInput) {
            fileInput.addEventListener('change', () => {
                if (window.innerWidth <= 768) {
                    closeMenu();
                }
            });
        }
    }
});

/* =========================================================================
   MODEL PREVIEW LOGIC
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openModelPreviewBtn');
    const closeBtn = document.getElementById('closeModelModalBtn');
    const modal = document.getElementById('modelModal');
    
    const genderBtns = document.querySelectorAll('#genderToggle .toggle-btn');
    const sizeBtns = document.querySelectorAll('#sizeToggle .toggle-btn');
    
    const baseImg = document.getElementById('modelBaseImage');
    const maskArea = document.getElementById('modelMaskArea');
    const designImg = document.getElementById('modelDesignImg');
    const designElement = document.getElementById('modelDesignElement');
    
    // Scale simulation multipliers relative to M
    // S: Design looks larger on the shirt
    // XL: Design looks smaller on the shirt
    const sizeMultipliers = {
        'S': 1.15,
        'M': 1.0,
        'L': 0.88,
        'XL': 0.78
    };

    // Offset configurations to map from flat shirt coordinates to model shirt coordinates
    const modelConfig = {
        male: {
            offsetX: 0,
            offsetY: 90, 
            scale: 0.85  
        },
        female: {
            offsetX: 0,
            offsetY: 90,
            scale: 0.85
        }
    };

    let currentGender = 'male';
    let currentSize = 'M';
    let customOffsetX = 0;
    let customOffsetY = 0;

    function updateModelView() {
        // Update image and mask based on gender with cache buster
        const cacheBust = '?v=10';
        baseImg.src = `assets/model_${currentGender}.png${cacheBust}`;
        maskArea.style.maskImage = `url('assets/mask_model_${currentGender}.png${cacheBust}')`;
        maskArea.style.webkitMaskImage = `url('assets/mask_model_${currentGender}.png${cacheBust}')`;
        
        const config = modelConfig[currentGender];
        
        // Apply size multiplier combined with the model's base scale
        const multiplier = (sizeMultipliers[currentSize] || 1.0) * config.scale;
        
        const baseX = parseFloat(designElement.getAttribute('data-x')) || 0;
        const baseY = parseFloat(designElement.getAttribute('data-y')) || 0;
        
        const finalX = baseX + config.offsetX + customOffsetX;
        const finalY = baseY + config.offsetY + customOffsetY;
        
        // The scale applies around the center of the design
        designElement.style.transform = `translate(${finalX}px, ${finalY}px) scale(${multiplier})`;
    }

    function syncDesignFromFront() {
        const frontCard = document.getElementById('view-front');
        const frontImg = frontCard.querySelector('.design-img');
        const frontEl = frontCard.querySelector('.design-element');
        
        if (frontEl.classList.contains('active') && frontImg.src) {
            customOffsetX = 0;
            customOffsetY = 0;
            designImg.src = frontImg.src;
            designElement.style.display = 'block';
            
            // We copy over the physical width
            designElement.style.width = frontEl.style.width || frontEl.offsetWidth + 'px';
            
            // And position
            const x = parseFloat(frontEl.getAttribute('data-x')) || 0;
            const y = parseFloat(frontEl.getAttribute('data-y')) || 0;
            designElement.setAttribute('data-x', x);
            designElement.setAttribute('data-y', y);
        } else {
            designElement.style.display = 'none';
            designImg.src = '';
        }
    }

    openBtn.addEventListener('click', () => {
        syncDesignFromFront();
        updateModelView();
        modal.classList.add('active');
        
        // Optional: close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('menuBackdrop');
        if (sidebar && backdrop) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('open');
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    genderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGender = btn.getAttribute('data-val');
            // Reset custom drag offsets when changing styles
            customOffsetX = 0;
            customOffsetY = 0;
            updateModelView();
        });
    });

    sizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = btn.getAttribute('data-val');
            // Keep custom offsets when changing sizes
            updateModelView();
        });
    });

    // Make the model design element draggable
    interact(designElement).draggable({
        listeners: {
            move(event) {
                const config = modelConfig[currentGender];
                const multiplier = (sizeMultipliers[currentSize] || 1.0) * config.scale;
                
                // Convert screen movement pixels to visual pixels based on scale
                customOffsetX += event.dx / multiplier;
                customOffsetY += event.dy / multiplier;
                updateModelView();
            }
        }
    });
});
