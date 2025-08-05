# Trajectory Viewer

An AI Agent Trajectory Explorer built with Hugo and JavaScript for viewing AI agent conversation histories and performance data.

## Features

- **Experiment Navigation**: Browse through different experiments with previous/next buttons and dropdown selection
- **Instance Navigation**: Navigate through instances within each experiment
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
│   ├── data-index.json            # Experiment/instance index
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

### Adding New Experiments

1. Create a new folder in the `data/` directory with your experiment name
2. Create instance folders within the experiment folder
3. Place `.traj.json` files in each instance folder
4. Update `static/data-index.json` to include the new experiment:

```json
{
  "experiments": [
    {
      "name": "your-experiment-name",
      "instances": ["instance1", "instance2"]
    }
  ]
}
```

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