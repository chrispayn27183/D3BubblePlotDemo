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
    const svg = d3.select("#bubble-chart");
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;
    // Compute visible segments here so we know how many for plotting shape
    const visibleSegments = segmentData.children.filter(seg => 
        state.visibleSegments.has(seg.id)
    );
    // If only one segment, plot as a single filled circle. Otherwise, donut.
    let radius, innerRadius;
    if (visibleSegments.length === 1) {
        radius = Math.min(width, height) / 2 - 50;
        innerRadius = 0; // full circle
    } else {
        radius = Math.min(width, height) / 2 - 50;
        innerRadius = radius * 0.3; // donut donut
    }
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Create a group for the chart
    const chartGroup = svg.append("g")
        .attr("transform", `translate(${centerX},${centerY})`);
    
    if (visibleSegments.length === 0) return;
    
    // Calculate total value for pie chart
    const totalValue = visibleSegments.reduce((sum, seg) => {
        if (state.expandedSegments.has(seg.id) && seg.children) {
            return sum + seg.children.reduce((s, sub) => s + (sub.value || 0), 0);
        }
        return sum + (seg.value || 0);
    }, 0);
    
    // Create pie layout for radial segments
    const pie = d3.pie()
        .value(d => {
            if (state.expandedSegments.has(d.id) && d.children) {
                return d.children.reduce((sum, sub) => sum + (sub.value || 0), 0);
            }
            return d.value || 0;
        })
        .sort(null);
    
    const arcs = pie(visibleSegments);
    
    // Create arc generator
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius);
    
    // Draw each segment
    arcs.forEach((arcData, index) => {
        const segment = arcData.data;
        const isExpanded = state.expandedSegments.has(segment.id);
        
        // Create group for this segment
        const segmentGroup = chartGroup.append("g")
            .attr("class", "segment-group");
        
        // Draw the arc (orange slice)
        const path = segmentGroup.append("path")
            .attr("d", arc(arcData))
            .attr("fill", colorScale(index))
            .attr("opacity", 0.3)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        
        // Calculate center of the arc for nested packing
        const centroid = arc.centroid(arcData);
        const arcCenterX = centroid[0];
        const arcCenterY = centroid[1];
        
        // Get the angle for rotation
        const startAngle = arcData.startAngle;
        const endAngle = arcData.endAngle;
        const angle = (startAngle + endAngle) / 2;
        
        // Create a group for nested bubbles, rotated to align with segment
        const bubbleGroup = segmentGroup.append("g")
            .attr("transform", `translate(${arcCenterX},${arcCenterY}) rotate(${angle * 180 / Math.PI})`);
        
        // Prepare data for packing within this segment
        // Always show sub-segments with their companies
        let packData;
        if (segment.children) {
            packData = {
                name: segment.name,
                children: segment.children.map(subSeg => ({
                    name: subSeg.name,
                    value: subSeg.value,
                    children: subSeg.children || []
                }))
            };
        } else {
            packData = { name: segment.name, children: [] };
        }
        
        if (packData.children && packData.children.length > 0) {
            const outerRadius = radius;
            const arcSpan = endAngle - startAngle;
            
            // Calculate the maximum usable space within the arc
            // Use a more conservative approach - calculate the inscribed rectangle
            const maxWidth = 2 * outerRadius * Math.sin(arcSpan / 2);
            const maxHeight = outerRadius - innerRadius;
            
            // Start with a conservative pack size
            let packSize = Math.min(maxWidth, maxHeight) * 0.75;
            
            // Create pack layout for sub-segments
            let pack = d3.pack()
                .size([packSize, packSize])
                .padding(2);
            
            // Build hierarchy: segment -> sub-segments -> companies
            let packRoot = d3.hierarchy(packData)
                .sum(d => {
                    if (d.children && d.children.length > 0) {
                        return d.children.reduce((sum, subSeg) => {
                            if (subSeg.children && subSeg.children.length > 0) {
                                return sum + subSeg.children.reduce((s, company) => s + (company.value || 0), 0);
                            }
                            return sum + (subSeg.value || 0);
                        }, 0);
                    }
                    return d.value || 0;
                })
                .sort((a, b) => b.value - a.value);
            
            pack(packRoot);
            
            // Iteratively check and scale down until all nodes fit within arc boundaries
            let maxIterations = 10;
            let iteration = 0;
            let allNodesFit = false;
            
            while (!allNodesFit && iteration < maxIterations) {
                allNodesFit = true;
                let minScaleFactor = 1;
                
                packRoot.descendants().filter(d => d.depth > 0).forEach(node => {
                    // Transform node position to chart coordinates (before rotation)
                    const nodeX = node.x - packSize/2;
                    const nodeY = node.y - packSize/2;
                    
                    // Apply rotation
                    const rotatedX = nodeX * Math.cos(angle) - nodeY * Math.sin(angle);
                    const rotatedY = nodeX * Math.sin(angle) + nodeY * Math.cos(angle);
                    
                    // Transform to global coordinates
                    const globalX = arcCenterX + rotatedX;
                    const globalY = arcCenterY + rotatedY;
                    
                    const distance = Math.sqrt(globalX * globalX + globalY * globalY);
                    
                    // Check radial boundaries
                    const maxDistance = distance + node.r;
                    const minDistance = Math.max(0, distance - node.r);
                    
                    if (maxDistance > outerRadius) {
                        allNodesFit = false;
                        const requiredScale = (outerRadius - node.r) / distance;
                        minScaleFactor = Math.min(minScaleFactor, requiredScale * 0.98);
                    }
                    
                    if (minDistance < innerRadius && distance > 0) {
                        allNodesFit = false;
                        const requiredScale = (innerRadius + node.r) / distance;
                        minScaleFactor = Math.min(minScaleFactor, requiredScale * 0.98);
                    }
                });
                
                // If nodes don't fit, scale down and repack
                if (!allNodesFit && minScaleFactor < 1) {
                    packSize = packSize * minScaleFactor;
                    pack = d3.pack()
                        .size([packSize, packSize])
                        .padding(2);
                    packRoot = d3.hierarchy(packData)
                        .sum(d => {
                            if (d.children && d.children.length > 0) {
                                return d.children.reduce((sum, subSeg) => {
                                    if (subSeg.children && subSeg.children.length > 0) {
                                        return sum + subSeg.children.reduce((s, company) => s + (company.value || 0), 0);
                                    }
                                    return sum + (subSeg.value || 0);
                                }, 0);
                            }
                            return d.value || 0;
                        })
                        .sort((a, b) => b.value - a.value);
                    pack(packRoot);
                }
                
                iteration++;
            }
            
            // Draw sub-segments and their companies
            packRoot.children.forEach(subSegNode => {
                // Check if this sub-segment has companies in its data
                if (!subSegNode.data.children || subSegNode.data.children.length === 0) return;
                
                // Position of this sub-segment cluster
                const subSegX = subSegNode.x - packSize/2;
                const subSegY = subSegNode.y - packSize/2;
                
                // Create group for this sub-segment's companies
                const subSegGroup = bubbleGroup.append("g")
                    .attr("transform", `translate(${subSegX},${subSegY})`);
                
                // Calculate available space for companies within this sub-segment
                const companyAreaSize = subSegNode.r * 2;
                
                // Pack companies within this sub-segment
                const companyPack = d3.pack()
                    .size([companyAreaSize, companyAreaSize])
                    .padding(0.3);
                
                const companyData = {
                    name: subSegNode.data.name,
                    children: subSegNode.data.children || []
                };
                
                let companyRoot = d3.hierarchy(companyData)
                    .sum(d => d.value || 0)
                    .sort((a, b) => b.value - a.value);
                
                companyPack(companyRoot);
                
                // Check if companies fit and scale if needed
                let companyScaleFactor = 1;
                companyRoot.descendants().filter(d => d.depth > 0).forEach(companyNode => {
                    const companyX = companyNode.x;
                    const companyY = companyNode.y;
                    const distanceFromCenter = Math.sqrt(
                        (companyX - companyAreaSize/2) ** 2 + 
                        (companyY - companyAreaSize/2) ** 2
                    );
                    
                    if (distanceFromCenter + companyNode.r > subSegNode.r) {
                        const requiredScale = (subSegNode.r - 1) / (distanceFromCenter + companyNode.r);
                        companyScaleFactor = Math.min(companyScaleFactor, requiredScale * 0.95);
                    }
                });
                
                // Rescale companies if needed
                if (companyScaleFactor < 1) {
                    const scaledSize = companyAreaSize * companyScaleFactor;
                    companyPack.size([scaledSize, scaledSize]);
                    companyRoot = d3.hierarchy(companyData)
                        .sum(d => d.value || 0)
                        .sort((a, b) => b.value - a.value);
                    companyPack(companyRoot);
                }
                
                // Draw all companies in this sub-segment
                companyRoot.descendants().filter(d => d.depth > 0).forEach(companyNode => {
                    subSegGroup.append("circle")
                        .attr("cx", companyNode.x)
                        .attr("cy", companyNode.y)
                        .attr("r", Math.max(0.5, companyNode.r))
                        .attr("fill", d3.color(colorScale(index)).brighter(0.6))
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 0.3)
                        .attr("opacity", 0.8);
                });
            });
        }
        
        // Add label outside the segment
        const labelRadius = radius + 20;
        const labelAngle = (arcData.startAngle + arcData.endAngle) / 2;
        const labelX = Math.cos(labelAngle) * labelRadius;
        const labelY = Math.sin(labelAngle) * labelRadius;
        
        segmentGroup.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", labelAngle > Math.PI ? "end" : "start")
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

