# Trajectory Viewer

An AI Agent Trajectory Explorer built with Hugo and JavaScript for viewing AI agent conversation histories and performance data.

## Features

- **Experiment Navigation**: Browse through different experiments with previous/next buttons and dropdown selection
- **Instance Navigation**: Navigate through instances within each experiment
- **URL Routing**: Direct links to specific experiments and instances with deep linking support
- **Browser Navigation**: Full support for browser back/forward buttons and history
- **Overview Display**: Shows exit status, model statistics, API calls, and costs
- **Message Formatting**: Displays all conversation messages with proper formatting for different roles (system, user, assistant)
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
traj-viewer-mini/
├── data/                           # Trajectory data directory
│   └── [experiment-name]/          # Experiment folders
│       └── [instance-name]/        # Instance folders
│           └── [instance].traj.json # Trajectory JSON files
├── layouts/                        # Hugo templates
│   ├── _default/
│   │   └── baseof.html            # Base template
│   └── index.html                 # Main page template
├── static/                         # Static assets
│   ├── css/
│   │   └── style.css              # Stylesheet
│   ├── js/
│   │   └── trajectory-viewer.js   # Main JavaScript
│   └── data/                      # Symlink to data directory
├── content/
│   └── _index.md                  # Home page content
└── hugo.toml                      # Hugo configuration
```

## Data Format

Each trajectory file should follow this JSON structure:

```json
{
  "info": {
    "exit_status": null,
    "submission": null,
    "model_stats": {
      "instance_cost": 0.0661002,
      "api_calls": 11
    }
  },
  "messages": [
    {
      "role": "system|user|assistant",
      "content": "Message content..."
    }
  ],
  "trajectory_format": "mini-swe-agent-1"
}
```

## Usage

### Development Server

```bash
hugo server
```

Then open http://localhost:1313 in your browser.

### URL Routing

The trajectory viewer supports direct linking to specific experiments and instances:

**Experiment URLs:**
- `http://localhost:1313/example-experiemnt` - View specific experiment
- `http://localhost:1313/experiment-1` - View experiment-1
- `http://localhost:1313/` - Home page with no experiment selected

**Instance URLs:**
- `http://localhost:1313/example-experiemnt/example_instance` - View specific experiment and instance
- `http://localhost:1313/experiment-1/instance_1` - View experiment-1, instance_1

**Features:**
- **Deep Linking**: Share URLs to specific experiments or instances
- **Browser Navigation**: Back/forward buttons work correctly
- **Auto-Selection**: When navigating to an experiment URL, the first instance is automatically selected
- **URL Updates**: URLs update automatically as you navigate through the interface
- **Bookmarking**: Bookmark specific trajectories and return to them later

**URL Structure:**
```
/                          # Home page (no selection)
/{experiment-name}         # Experiment with first instance
/{experiment-name}/{instance-name}  # Specific experiment and instance
```

### Adding New Experiments

1. Create a new folder in the `data/` directory with your experiment name
2. Create instance folders within the experiment folder  
3. Place `.traj.json` files in each instance folder

The trajectory viewer will automatically discover experiments and instances when you reload the page. It tries common naming patterns, so using standard names like `experiment-1`, `instance_1`, etc. will ensure reliable discovery.

## Automatic Discovery

The trajectory viewer uses an intelligent discovery system that eliminates the need for manual index files:

- **Experiment Discovery**: Tries common experiment naming patterns like `example-experiment`, `experiment-1`, `test-experiment`, etc.
- **Instance Discovery**: For each found experiment, discovers instances using patterns like `instance_1`, `example_instance`, `test_instance`, etc.
- **Validation**: Only includes experiments/instances that have valid `.traj.json` files
- **Console Logging**: Check browser console for discovery progress and found experiments

This approach automatically adapts to your data structure without requiring manual configuration.

### Building for Production

```bash
hugo --minify
```

The generated site will be in the `public/` directory.

## Interface

### Top Navigation Bar

**Row 1: Experiment Navigation**
- Previous Experiment button
- Experiment dropdown selector
- Next Experiment button

**Row 2: Instance Navigation**
- Previous Instance button
- Instance dropdown selector  
- Next Instance button

### Overview Block

Displays trajectory metadata:
- Exit Status
- Instance Cost
- API Calls Count
- Total Messages

**Submission Section**: If present, the submission content is displayed as a full formatted field below the overview stats, similar to message format but with appropriate styling for longer content.

### Messages Section

Shows the complete conversation history with:
- Role-based color coding (system, user, assistant)
- Message numbering
- Formatted content display
- Scrollable content for long messages

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers

## Thread Safety

Environment variable modifications in the JavaScript are implemented in a thread-safe manner to prevent race conditions during navigation.