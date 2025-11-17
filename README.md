# D3 Bubble Plot Demo

An interactive bubble plot visualization with hierarchical segments, built with D3.js. This project demonstrates a packed bubble chart where segments can be toggled on/off and expanded to show sub-segments.

## Features

- **Interactive Bubble Plot**: Segments fill from the outside using D3's pack layout
- **Toggle Segments**: Use checkboxes in the left panel to show/hide segments
- **Hierarchical Segments**: Click the "+" button to expand segments and view sub-segments
- **Dynamic Visualization**: When expanded, sub-segments replace the parent segment in the visualization
- **Labels**: Each segment has a label displayed outside the bubble

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local server) - OR - any web server

### Running the Project

#### Option 1: Using Python (Recommended)

```bash
python3 -m http.server 8000
```

Then open your browser and navigate to:
```
http://localhost:8000
```

#### Option 2: Using Node.js http-server

```bash
npx http-server -p 8000
```

#### Option 3: Using any web server

Simply serve the `index.html` file using any web server of your choice.

## Project Structure

```
D3BubblePlotDemo/
├── index.html      # Main HTML structure
├── style.css       # Styling for layout and controls
├── script.js       # D3.js visualization logic
├── package.json    # Project metadata
└── README.md       # This file
```

## How to Use

1. **Toggle Segments**: Use the checkboxes next to segment names to show or hide them in the visualization
2. **Expand Segments**: Click the "+" button next to a segment name to expand and see its sub-segments
3. **Collapse Segments**: Click the "−" button to collapse and return to the parent segment view
4. **View Labels**: Each bubble has a label displayed outside showing the segment name

## Customization

To modify the segments, edit the `segmentData` object in `script.js`:

```javascript
const segmentData = {
    name: "root",
    children: [
        {
            name: "Segment 1",
            id: "segment-1",
            value: 30,
            children: [
                { name: "Segment 1.1", id: "segment-1-1", value: 10 },
                // ... more sub-segments
            ]
        },
        // ... more segments
    ]
};
```

## Technologies Used

- [D3.js v7](https://d3js.org/) - Data visualization library
- HTML5 & CSS3 - Structure and styling
- Vanilla JavaScript - No frameworks required

## License

MIT

