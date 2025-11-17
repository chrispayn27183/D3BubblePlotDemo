// Helper function to generate company names
function generateCompanies(count, prefix) {
    const companies = [];
    for (let i = 1; i <= count; i++) {
        companies.push({
            name: `Company ${prefix}.${i}`,
            id: `company-${prefix}-${i}`,
            value: Math.random() * 2 + 0.5 // Random value between 0.5 and 2.5
        });
    }
    return companies;
}

// Sample hierarchical data structure with companies
const segmentData = {
    name: "root",
    children: [
        {
            name: "Segment 1",
            id: "segment-1",
            value: 30,
            children: [
                { 
                    name: "Segment 1.1", 
                    id: "segment-1-1", 
                    value: 10,
                    children: generateCompanies(25, "1-1")
                },
                { 
                    name: "Segment 1.2", 
                    id: "segment-1-2", 
                    value: 8,
                    children: generateCompanies(20, "1-2")
                },
                { 
                    name: "Segment 1.3", 
                    id: "segment-1-3", 
                    value: 7,
                    children: generateCompanies(18, "1-3")
                },
                { 
                    name: "Segment 1.4", 
                    id: "segment-1-4", 
                    value: 5,
                    children: generateCompanies(15, "1-4")
                }
            ]
        },
        {
            name: "Segment 2",
            id: "segment-2",
            value: 25,
            children: [
                { 
                    name: "Segment 2.1", 
                    id: "segment-2-1", 
                    value: 12,
                    children: generateCompanies(30, "2-1")
                },
                { 
                    name: "Segment 2.2", 
                    id: "segment-2-2", 
                    value: 8,
                    children: generateCompanies(20, "2-2")
                },
                { 
                    name: "Segment 2.3", 
                    id: "segment-2-3", 
                    value: 5,
                    children: generateCompanies(15, "2-3")
                }
            ]
        },
        {
            name: "Segment 3",
            id: "segment-3",
            value: 20,
            children: [
                { 
                    name: "Segment 3.1", 
                    id: "segment-3-1", 
                    value: 10,
                    children: generateCompanies(25, "3-1")
                },
                { 
                    name: "Segment 3.2", 
                    id: "segment-3-2", 
                    value: 10,
                    children: generateCompanies(25, "3-2")
                }
            ]
        },
        {
            name: "Segment 4",
            id: "segment-4",
            value: 15,
            children: [
                { 
                    name: "Segment 4.1", 
                    id: "segment-4-1", 
                    value: 8,
                    children: generateCompanies(20, "4-1")
                },
                { 
                    name: "Segment 4.2", 
                    id: "segment-4-2", 
                    value: 7,
                    children: generateCompanies(18, "4-2")
                }
            ]
        },
        {
            name: "Segment 5",
            id: "segment-5",
            value: 10,
            children: [
                { 
                    name: "Segment 5.1", 
                    id: "segment-5-1", 
                    value: 5,
                    children: generateCompanies(15, "5-1")
                },
                { 
                    name: "Segment 5.2", 
                    id: "segment-5-2", 
                    value: 5,
                    children: generateCompanies(15, "5-2")
                }
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

// Create the bubble chart with radial segments
function createBubbleChart() {
    const svg = d3.select("#bubble-chart");                                         // Select the SVG element
    const width = svg.node().getBoundingClientRect().width;                         // Get SVG width
    const height = svg.node().getBoundingClientRect().height;                       // Get SVG height
    const centerX = width / 2;                                                      // X center for chart group
    const centerY = height / 2;                                                     // Y center for chart group

    // Compute visible segments here so we know how many for plotting shape
    const visibleSegments = segmentData.children.filter(seg => 
        state.visibleSegments.has(seg.id)                                           // Only include visible segments
    );
    
    // If only one segment, plot as a single filled circle. Otherwise, donut.
    let radius, innerRadius;
    if (visibleSegments.length === 1) {
        radius = Math.min(width, height) / 2 - 50;                                  // Main circle size if only one
        innerRadius = 0;                                                            // No hole (not a donut)
    } else {
        radius = Math.min(width, height) / 2 - 50;                                  // Outer radius for donut
        innerRadius = radius * 0.2;                                                 // Inner radius for donut hole
    }
    
    // Clear previous content
    svg.selectAll("*").remove();                                                    // Remove any previous drawing
    
    // Create a group for the chart
    const chartGroup = svg.append("g")
        .attr("transform", `translate(${centerX},${centerY})`);                     // Center the chart

    if (visibleSegments.length === 0) return;                                       // Nothing to draw if no segments

    const segmentCount = visibleSegments.length;                                    // Number of visible segments
    const angleStep = (Math.PI * 2) / segmentCount;                                 // Angle covered by each segment
    const baseOffset = -Math.PI / 2;                                                // Start at top (12 o'clock)
    
    // Calculate arcs for each visible segment
    const arcs = visibleSegments.map((segment, index) => {
        const startAngle = baseOffset + index * angleStep;                          // Start angle of segment
        const endAngle = startAngle + angleStep;                                    // End angle of segment
        return {
            data: segment,
            startAngle,
            endAngle
        };
    });
    
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));         // Clamp utility

    // Create arc generator
    const arc = d3.arc()
        .innerRadius(innerRadius)                                                   // Set donut inner radius
        .outerRadius(radius);                                                       // Set donut/circle outer radius

    // Draw each segment
    arcs.forEach((arcData, index) => {
        const segment = arcData.data;                                               // Segment object for this arc
        const isExpanded = state.expandedSegments.has(segment.id);                  // Is this segment expanded?

        // Create group for this segment
        const segmentGroup = chartGroup.append("g")
            .attr("class", "segment-group");                                        // For styling/organization
        
        // Draw the arc (orange slice)
        const path = segmentGroup.append("path")
            .attr("d", arc(arcData))                                                // Path for arc (donut shape)
            .attr("fill", colorScale(index))                                        // Segment color
            .attr("opacity", 0.3)                                                   // Faint fill
            .attr("stroke", "#fff")                                                 // White border
            .attr("stroke-width", 2);                                               // Border width
        
        // Get the angle for rotation - use middle angle for alignment
        const startAngle = arcData.startAngle;                                      // This segment's start
        const endAngle = arcData.endAngle;                                          // This segment's end
        const angle = (startAngle + endAngle) / 2;                                  // Middle angle for label

        // Create a group for nested bubbles anchored at chart center (0,0)
        const bubbleGroup = segmentGroup.append("g");                               // Bubbles are organized here
        
        // ----- PACKING PREP -----
        // Prepare data for packing within this segment
        // Always show sub-segments with their companies
        let packData;
        if (segment.children) {
            packData = {
                name: segment.name,
                children: segment.children.map(subSeg => ({
                    name: subSeg.name,                                              // Sub-segment name
                    value: subSeg.value,                                            // Sub-segment size
                    children: subSeg.children || []                                 // Companies as children
                }))
            };
        } else {
            packData = { name: segment.name, children: [] };                        // No children
        }
        
        // Only run packing/bubble layout if there are children
        if (packData.children && packData.children.length > 0) {
            const pack = d3.pack()
                .size([1, 1])                                                       // Pack layout in 1x1 "unit" box
                .padding(0.003);                                                    // Tiny padding between bubbles
            
            const packRoot = d3.hierarchy(packData)
                .sum(d => {
                    if (d.children && d.children.length > 0) {
                        return d.children.reduce((sum, child) => sum + (child.value || 0), 0); // Sum values of children
                    }
                    return d.value || 0;                                            // Use self value if leaf
                })
                .sort((a, b) => b.value - a.value);                                 // Largest first
            
            pack(packRoot);                                                          // Calculate layout
            
            const radialRange = Math.max(0, radius - innerRadius);                   // Space available radially
            const angleRange = endAngle - startAngle;                               // Angle covered by this segment
            const averageRadius = innerRadius + radialRange / 2;                    // Used for scaling
            const angularScale = angleRange * Math.max(averageRadius, 1);           // Scaled "arc" length
            const radiusScale = Math.max(radialRange, 1);                           // Ensure scale is valid
            const midAngle = (startAngle + endAngle) / 2;                           // Middle of this segment

            // Only companies (skip root and sub-segment nodes)
            const companies = packRoot.descendants().filter(d => d.depth > 1);      // Only leaf company nodes

            // Draw each company as a bubble within the segment
            companies.forEach(companyNode => {
                const normalizedAngle = companyNode.x;                              // X (0-1) in pack layout
                const normalizedRadius = companyNode.y;                             // Y (0-1) in pack layout
                
                const rawCircleRadius = companyNode.r * Math.min(radiusScale, angularScale) * 0.75; // Radius (scaled)
                const circleRadius = Math.max(0.6, rawCircleRadius);                // Enforce min radius
                const radialPadding = circleRadius + 2;                             // Bubble "buffer"

                const radialMin = innerRadius + radialPadding;                      // Closest allowed to center
                const radialMax = radius - radialPadding;                           // Farthest allowed from center
                const unclampedRadius = innerRadius + normalizedRadius * radialRange;// Natural radial location
                const bubbleRadius = (radialMin >= radialMax)
                    ? (innerRadius + radius) / 2                                    // Edge case: draw in middle
                    : clamp(unclampedRadius, radialMin, radialMax);                 // Otherwise: clamp safely
                    
                const anglePadding = Math.min(
                    angleRange * 0.35,
                    (circleRadius / Math.max(bubbleRadius, 1)) * 1.15
                );                                                                  // Prevent bubbles from overlapping arc edge
                const paddedStart = startAngle + anglePadding;                      // Left bound for angle
                const paddedEnd = endAngle - anglePadding;                          // Right bound for angle
                const tangentialOffset = (normalizedAngle - 0.5) * angleRange * 0.8;// Map [0,1] onto centered segment portion
                const unclampedAngle = midAngle + tangentialOffset;                 // Natural angle of bubble
                const bubbleAngle = (paddedStart >= paddedEnd)
                    ? midAngle                                                     // Edge case: just use center
                    : clamp(unclampedAngle, paddedStart, paddedEnd);                // Otherwise keep within arc
                    
                const bubbleX = Math.cos(bubbleAngle) * bubbleRadius;               // Final x position
                const bubbleY = Math.sin(bubbleAngle) * bubbleRadius;               // Final y position
                    
                bubbleGroup.append("circle")
                    .attr("cx", bubbleX)                                            // Position x
                    .attr("cy", bubbleY)                                            // Position y
                    .attr("r", circleRadius)                                        // Bubble radius
                    .attr("fill", d3.color(colorScale(index)).brighter(0.6))        // Fill color (lighter)
                    .attr("stroke", "#fff")                                         // White border
                    .attr("stroke-width", 0.3)                                      // Thin border
                    .attr("opacity", 0.85);                                         // Slightly transparent
            });
        }
        
        // Add label outside the segment - use same angle for alignment
        const labelRadius = radius + 20;
        const labelX = Math.cos(angle) * labelRadius;
        const labelY = Math.sin(angle) * labelRadius;
        
        segmentGroup.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("class", "bubble-label")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .text(segment.name);
    });
}

// Create the left panel controls
function createControls() {
    const container = d3.select("#segment-list");
    container.selectAll("*").remove();
    
    segmentData.children.forEach(segment => {
        const isExpanded = state.expandedSegments.has(segment.id);
        const isVisible = state.visibleSegments.has(segment.id);
        
        const segmentDiv = container.append("div")
            .attr("class", "segment-item segment-row");

        segmentDiv.append("input")
            .attr("type", "checkbox")
            .attr("class", "segment-checkbox")
            .attr("id", segment.id)
            .property("checked", isVisible)
            .on("change", function() {
                toggleSegment(segment.id, this.checked);
            });
        
        segmentDiv.append("label")
            .attr("class", "segment-label")
            .attr("for", segment.id)
            .text(segment.name);
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

// Update active data based on expanded state
function updateActiveData() {
    const children = segmentData.children
        .filter(segment => state.visibleSegments.has(segment.id))
        .map(segment => ({
            name: segment.name,
            id: segment.id,
            value: segment.value
        }));

    state.activeData = { name: "root", children };
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

