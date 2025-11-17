// Sample hierarchical data structure
const segmentData = {
    name: "root",
    children: [
        {
            name: "Segment 1",
            id: "segment-1",
            value: 30,
            children: [
                { name: "Segment 1.1", id: "segment-1-1", value: 10 },
                { name: "Segment 1.2", id: "segment-1-2", value: 8 },
                { name: "Segment 1.3", id: "segment-1-3", value: 7 },
                { name: "Segment 1.4", id: "segment-1-4", value: 5 }
            ]
        },
        {
            name: "Segment 2",
            id: "segment-2",
            value: 25,
            children: [
                { name: "Segment 2.1", id: "segment-2-1", value: 12 },
                { name: "Segment 2.2", id: "segment-2-2", value: 8 },
                { name: "Segment 2.3", id: "segment-2-3", value: 5 }
            ]
        },
        {
            name: "Segment 3",
            id: "segment-3",
            value: 20,
            children: [
                { name: "Segment 3.1", id: "segment-3-1", value: 10 },
                { name: "Segment 3.2", id: "segment-3-2", value: 10 }
            ]
        },
        {
            name: "Segment 4",
            id: "segment-4",
            value: 15,
            children: [
                { name: "Segment 4.1", id: "segment-4-1", value: 8 },
                { name: "Segment 4.2", id: "segment-4-2", value: 7 }
            ]
        },
        {
            name: "Segment 5",
            id: "segment-5",
            value: 10,
            children: [
                { name: "Segment 5.1", id: "segment-5-1", value: 5 },
                { name: "Segment 5.2", id: "segment-5-2", value: 5 }
            ]
        }
    ]
};

// State management
const state = {
    expandedSegments: new Set(),
    visibleSegments: new Set(),
    activeData: segmentData
};

// Initialize visible segments (all top-level segments visible by default)
segmentData.children.forEach(seg => {
    state.visibleSegments.add(seg.id);
});

// Color scale for segments
const colorScale = d3.scaleOrdinal()
    .domain(segmentData.children.map((d, i) => i))
    .range([
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
    ]);

// Get color for a segment
function getColor(d) {
    if (d.depth === 0) return "#e0e0e0";
    
    // Find which parent segment this belongs to
    let parentSegment = null;
    let parentIndex = -1;
    
    // Check if it's a direct child (parent segment)
    const directIndex = segmentData.children.findIndex(child => child.id === d.data.id);
    if (directIndex >= 0) {
        parentIndex = directIndex;
        parentSegment = segmentData.children[directIndex];
    } else {
        // It's a sub-segment, find its parent
        segmentData.children.forEach((child, idx) => {
            if (child.children && child.children.some(sub => sub.id === d.data.id)) {
                parentIndex = idx;
                parentSegment = child;
            }
        });
    }
    
    if (parentIndex >= 0) {
        const baseColor = colorScale(parentIndex);
        // If it's a sub-segment, use a lighter shade
        if (parentSegment && parentSegment.children && 
            parentSegment.children.some(sub => sub.id === d.data.id)) {
            return d3.color(baseColor).brighter(0.5);
        }
        return baseColor;
    }
    
    return "#cccccc";
}

// Create the bubble chart
function createBubbleChart() {
    const svg = d3.select("#bubble-chart");
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Create pack layout
    const pack = d3.pack()
        .size([width, height])
        .padding(3);
    
    // Process data based on current state
    const root = d3.hierarchy(state.activeData)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);
    
    pack(root);
    
    // Create groups for each bubble (only depth 1 nodes, as we've flattened the structure)
    const node = svg.selectAll("g")
        .data(root.descendants().filter(d => d.depth > 0))
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", "bubble");
    
    // Draw circles
    node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => getColor(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8);
    
    // Add labels outside the bubbles
    node.append("text")
        .attr("class", "bubble-label")
        .attr("dy", d => d.r + 15)
        .text(d => d.data.name)
        .attr("font-size", d => Math.min(12, d.r / 3));
}

// Create the left panel controls
function createControls() {
    const container = d3.select("#segment-list");
    container.selectAll("*").remove();
    
    segmentData.children.forEach(segment => {
        const isExpanded = state.expandedSegments.has(segment.id);
        const isVisible = state.visibleSegments.has(segment.id);
        
        // Main segment row
        const segmentDiv = container.append("div")
            .attr("class", "segment-item");
        
        const row = segmentDiv.append("div")
            .attr("class", "segment-row");
        
        // Expand button
        const expandBtn = row.append("button")
            .attr("class", "expand-button")
            .text(isExpanded ? "−" : "+")
            .on("click", () => toggleExpand(segment.id));
        
        // Checkbox
        const checkbox = row.append("input")
            .attr("type", "checkbox")
            .attr("class", "segment-checkbox")
            .attr("id", segment.id)
            .property("checked", isVisible)
            .on("change", function() {
                toggleSegment(segment.id, this.checked);
            });
        
        // Label
        row.append("label")
            .attr("class", "segment-label")
            .attr("for", segment.id)
            .text(segment.name);
        
        // Sub-segments container
        if (segment.children && segment.children.length > 0) {
            const subContainer = segmentDiv.append("div")
                .attr("class", "sub-segments")
                .style("display", isExpanded ? "block" : "none");
            
            segment.children.forEach(subSegment => {
                const subRow = subContainer.append("div")
                    .attr("class", "segment-row");
                
                subRow.append("input")
                    .attr("type", "checkbox")
                    .attr("class", "segment-checkbox")
                    .attr("id", subSegment.id)
                    .property("checked", isVisible && isExpanded)
                    .on("change", function() {
                        // Sub-segment visibility is controlled by parent
                        // This is mainly for visual feedback
                    })
                    .property("disabled", !isExpanded || !isVisible);
                
                subRow.append("label")
                    .attr("class", "segment-label")
                    .attr("for", subSegment.id)
                    .text(subSegment.name);
            });
        }
    });
}

// Toggle segment visibility
function toggleSegment(segmentId, isVisible) {
    if (isVisible) {
        state.visibleSegments.add(segmentId);
    } else {
        state.visibleSegments.delete(segmentId);
        // If hiding parent, also collapse it
        state.expandedSegments.delete(segmentId);
    }
    
    // Update active data structure
    updateActiveData();
    createControls();
    createBubbleChart();
}

// Toggle expand/collapse
function toggleExpand(segmentId) {
    if (state.expandedSegments.has(segmentId)) {
        state.expandedSegments.delete(segmentId);
    } else {
        state.expandedSegments.add(segmentId);
    }
    
    updateActiveData();
    createControls();
    createBubbleChart();
}

// Update active data based on expanded state
function updateActiveData() {
    const children = [];
    
    segmentData.children.forEach(segment => {
        // Only process visible segments
        if (!state.visibleSegments.has(segment.id)) return;
        
        if (state.expandedSegments.has(segment.id) && segment.children) {
            // When expanded, add sub-segments directly (replacing parent)
            segment.children.forEach(subSegment => {
                children.push({
                    name: subSegment.name,
                    id: subSegment.id,
                    value: subSegment.value
                });
            });
        } else {
            // Show parent segment
            children.push({
                name: segment.name,
                id: segment.id,
                value: segment.value
            });
        }
    });
    
    state.activeData = {
        name: "root",
        children: children
    };
}

// Handle window resize
function handleResize() {
    createBubbleChart();
}

// Initialize
d3.select(window).on("resize", handleResize);
updateActiveData();
createControls();
createBubbleChart();

