# Enhanced Note Editor - Quick Start Guide

## 🚀 Getting Started

### Basic Usage
1. **Create a Note**: Click "New" or use templates via "Template" button
2. **Write Content**: Use the block-based editor with familiar tools
3. **Link Notes**: Type `[[Note Name]]` to create links between notes
4. **Add Tags**: Use `#tag` syntax to categorize your notes

## 🔗 Linking & Navigation

### Creating Links
```
[[My Other Note]]        → Creates link to "My Other Note"
[[Project Ideas]]        → Links to "Project Ideas" note
[[Meeting 2024-01-15]]   → Links to specific meeting note
```

### Autocomplete
- Type `[[` to see a list of existing notes
- Start typing to filter the list
- Click or press Enter to select

### Navigation
- Click any `[[link]]` to navigate to that note
- Use backlinks panel to see which notes reference the current one
- Use graph view to visualize all connections

## 🏷️ Tagging System

### Adding Tags
```
This is about #productivity and #workflows
Research on #machine-learning #AI #algorithms
Meeting notes #team #project-alpha #weekly
```

### Using Tags
- Tags panel shows all tags with note counts
- Click a tag to filter notes by that tag
- Tags are automatically extracted and updated

## 📊 Advanced Features

### Runnable Code Blocks
Insert executable code directly in your notes:

**JavaScript Example:**
```javascript
// Calculate compound interest
const principal = 1000;
const rate = 0.05;
const time = 10;
const amount = principal * Math.pow(1 + rate, time);
console.log(`After ${time} years: $${amount.toFixed(2)}`);
```

**Python Example (simulated):**
```python
# Data analysis
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
average = sum(data) / len(data)
print(f"Average: {average}")
```

### Data Visualization
Create charts from JSON data:

```json
[
  {"month": "Jan", "sales": 1200},
  {"month": "Feb", "sales": 1900},
  {"month": "Mar", "sales": 1600},
  {"month": "Apr", "sales": 2100}
]
```

## 📋 Templates

### Available Templates

#### Meeting Notes
- Pre-structured format for meetings
- Fields: Title, Date, Time, Attendees
- Sections: Agenda, Discussion, Action Items

#### Research Log
- Academic research documentation
- Fields: Topic, Date, Researcher
- Sections: Methodology, Sources, Findings

#### Daily Journal
- Personal reflection template
- Fields: Date, Mood
- Sections: Highlights, Challenges, Gratitude

#### Project Planning
- Comprehensive project structure
- Fields: Project Name, Manager, Dates
- Sections: Objectives, Stakeholders, Milestones

#### Learning Notes
- Study and learning documentation
- Fields: Subject, Date, Source
- Sections: Objectives, Concepts, Examples

### Using Templates
1. Click "Template" in the toolbar
2. Choose a category and template
3. Fill in the template fields
4. Click "Apply Template"

## 🎛️ Interface Controls

### Keyboard Shortcuts
- `Ctrl+F`: Open search overlay
- `Esc`: Close search or modals
- Double-click note title: Edit note name

### Panel Controls
- **🔗 Backlinks**: Toggle backlinks panel
- **# Tags**: Toggle tags panel  
- **🌐 Graph**: Toggle graph view
- **📌 Pin**: Pin/unpin current note
- **+ New**: Create blank note
- **📄 Template**: Create note from template

### Search Features
- Global search across all notes
- Real-time highlighting in editor
- Fuzzy matching for partial queries

## 🔍 Graph View

### Navigation
- **Click nodes**: Navigate to that note
- **Drag nodes**: Rearrange the layout
- **Zoom controls**: Use +/- buttons or mouse wheel
- **Reset view**: Click home button to center

### Visual Indicators
- **Blue nodes**: Current note
- **Yellow nodes**: Pinned notes
- **Gray nodes**: Regular notes
- **Line thickness**: Number of connections

## 💡 Pro Tips

### Effective Linking
- Use descriptive link names: `[[Project Alpha Planning]]` vs `[[Planning]]`
- Create hub notes that link to related topics
- Use consistent naming conventions

### Tag Strategy
- Use hierarchical tags: `#project/alpha` `#project/beta`
- Keep tags short and descriptive
- Use tags for contexts: `#work` `#personal` `#learning`

### Template Customization
- Modify template placeholders after applying
- Create your own patterns from successful templates
- Combine multiple templates for complex documents

### Code Blocks
- Use for calculations, data processing, and quick scripts
- JavaScript has access to Math, Date, JSON, and Array functions
- Keep code blocks focused on single tasks

### Performance
- Pin frequently accessed notes
- Use search instead of browsing for large collections
- Archive or delete unused notes periodically

## 🔧 Mode Differences

### Full Mode (Note Editor)
- All features enabled
- Multiple panels available
- Graph view and backlinks
- Templates and advanced tools

### Light Mode (Canvas Documents)  
- Basic editing only
- No linking or graph features
- Focused on content creation
- Integrated with canvas workspace

## 📱 Best Practices

### Organization
1. **Start with structure**: Use templates for consistent organization
2. **Link liberally**: Create connections between related concepts
3. **Tag consistently**: Develop a tagging system and stick to it
4. **Review regularly**: Use backlinks to discover connections

### Workflow Integration
1. **Daily notes**: Use daily journal template for regular reflection
2. **Meeting preparation**: Create meeting notes from template beforehand
3. **Research projects**: Use research log for systematic investigation
4. **Learning**: Document new concepts with learning notes template

### Collaboration
1. **Consistent naming**: Use clear, descriptive note names
2. **Reference properly**: Use full context in links and references
3. **Tag for discovery**: Help others find related content
4. **Document decisions**: Keep meeting notes and project planning updated

This enhanced note editor transforms your writing into an interconnected knowledge base, making information discovery and idea development more intuitive and powerful.